
/* Controlador de las reservas */
const crypto = require( 'node:crypto' )
const { Table, Reservation } = require( '../models' )
const { getAvailableTimes, pickTable, overlaps } = require( '../services/availability' )
const { getMadridNow } = require( '../services/madrid-time' )
const { sendEmailSafely } = require( '../services/notifications' )
const { TOKEN_PATTERN, validateBooking, validateReservationForm, validateDaysAhead } = require( '../services/reservation-validation' )
const { getSequence, buildReservationEmail, buildCancellationMessage } = require( '../emails/reservation-emails' )
const { fail } = require( './http' )

const NOT_FOUND_MESSAGE = 'No encontramos ninguna reserva con este enlace'
const NOT_FREE_MESSAGE = 'Esa hora ya no está libre. Elige otra, por favor'

/* La reserva de un código, o null si no hay ninguna. Un código mal formado o que no existe se tratan igual
(los dos acaban en el mismo 404), pero con uno mal formado ni consultamos la base de datos */
const findReservationByToken = async token => {
    if ( !TOKEN_PATTERN.test( token ) ) return null

    return Reservation.findOne({ token }).lean()
}

/* Las mesas en uso y las reservas confirmadas de un día.
excludeId (opcional): una reserva que no se cuenta, la que se está modificando, para que su propia mesa no la bloquee */
const getDayBookings = ( date, excludeId ) => Promise.all([
    Table.find({ active: true }).lean(),
    Reservation.find(
        { date, status: 'confirmed', ...( excludeId && { _id: { $ne: excludeId } } ) },
        { table: 1, time: 1, status: 1 }
    ).lean()
])

/* ¿Hay CUALQUIER otra reserva confirmada en la misma mesa, el mismo día y a menos de 90 minutos?
La usan crear y modificar, siempre DESPUÉS de guardar, para cubrir dos peticiones que llegan a la vez
y pasan las dos la comprobación de horas libres.
No miramos quién llegó antes: createdAt y _id los pone Mongoose en nuestro proceso antes de insertar,
y no tienen por qué seguir el orden en que las reservas llegan de verdad a la base de datos.
Si solo contáramos las "anteriores" podría pasar esto: B guarda y comprueba (A aún no está, B pasa);
luego A guarda y comprueba, pero B tiene createdAt posterior y no cuenta (A también pasa): dos en la misma mesa.
Mirando a todas, como cada petición escribe antes de leer, la que comprueba la última siempre ve a la otra:
nunca se quedan dos reservas en conflicto. El precio: si comprueban las dos a la vez, pueden anularse las dos
y las dos reciben 409. Es rarísimo, y el cliente solo tiene que elegir otra hora */
const hasClash = async reservation => {
    const others = await Reservation.find({
        _id: { $ne: reservation._id },
        date: reservation.date,
        table: reservation.table,
        status: 'confirmed'
    }).lean()

    return others.some( other => overlaps( other.time, reservation.time ) )
}

/* POST /api/reservations
Crea una reserva con los datos del formulario. La mesa, el estado y el código secreto los pone la API */
const postReservation = async ( req, res, next ) => {
    try {
        /* Si la petición llega sin cuerpo JSON, Express 5 deja req.body en undefined: con {} llega a la validación y responde 400 */
        const body = req.body ?? {}
        /* Solo cogemos los campos permitidos: si alguien manda status, table o token, se ignoran */
        const { date, time, name, phone, email, notes } = body
        const partySize = Number( body.partySize )

        const error = validateReservationForm({ date, time, partySize, name, phone, email, notes })
        if ( error ) return fail( res, 400, error )

        const now = getMadridNow()
        const daysAheadError = validateDaysAhead( date, now )
        if ( daysAheadError ) return fail( res, 400, daysAheadError )

        const [ tables, reservations ] = await getDayBookings( date )

        /* ¿Sigue libre esa hora? Con el mismo cálculo que la disponibilidad: si entre tanto ha pasado
        el margen de 2 horas o se han ocupado las mesas, ya no aparece */
        const times = getAvailableTimes({ date, partySize, tables, reservations, now })
        if ( !times.includes( time ) ) return fail( res, 409, NOT_FREE_MESSAGE )

        const table = pickTable({ tables, reservations, time, partySize })

        /* Código secreto para el enlace de modificar o cancelar: 24 bytes al azar, en texto apto para una URL */
        const token = crypto.randomBytes( 24 ).toString( 'base64url' )

        const reservation = await Reservation.create({
            date, time, partySize, name, phone, email, notes,
            table: table.number,
            token
        })

        /* Si dos personas reservan la misma mesa a la vez, las dos pueden pasar la comprobación de arriba.
        Después de guardar volvemos a mirar: si choca con cualquier otra (llegara antes o después), anulamos esta y avisamos.
        No basta con mirar las que llegaron antes: la explicación está encima de hasClash */
        if ( await hasClash( reservation ) ) {
            await Reservation.deleteOne({ _id: reservation._id })
            return fail( res, 409, NOT_FREE_MESSAGE )
        }

        /* Correo de confirmación con el enlace a "Mi reserva" */
        await sendEmailSafely( () => buildReservationEmail( reservation ), 'confirmación' )

        /* No devolvemos el código secreto: solo llega por correo. Si lo devolviéramos, quien reserve
        con el correo de otra persona podría modificar la reserva en bucle y llenarle el buzón de correos */
        res.status( 201 ).json({
            message: 'Reserva confirmada',
            data: {
                date: reservation.date,
                time: reservation.time,
                partySize: reservation.partySize,
                name: reservation.name
            }
        })
    } catch ( error ) {
        next( error )
    }
}

/* ¿Ya ha empezado la reserva? Comparamos con la hora de Madrid (now, de getMadridNow): primero el día y,
si es el mismo, la hora (como texto, AAAA-MM-DD y HH:MM). La usan leer y cancelar, así las dos miran lo mismo */
const isPastReservation = ( reservation, now ) =>
    reservation.date < now.date || ( reservation.date === now.date && reservation.time <= now.time )

/* Los datos de la reserva que se pueden enseñar en "Mi reserva".
Solo lo que hace falta para mostrarla: el enlace se puede reenviar, y quien lo tenga
no debe ver el teléfono ni el correo. Tampoco la mesa, el código ni los datos internos */
const toPublicReservation = ( reservation, now ) => ({
    date: reservation.date,
    time: reservation.time,
    partySize: reservation.partySize,
    name: reservation.name,
    notes: reservation.notes,
    status: reservation.status,
    isPast: isPastReservation( reservation, now )
})

/* Respuesta de "ya estaba cancelada": es un 200 y no un error, porque el resultado que se pide (que esté cancelada) ya se cumple */
const respondAlreadyCancelled = ( res, reservation, now ) => res.status( 200 ).json({
    message: 'La reserva ya estaba cancelada',
    data: toPublicReservation( reservation, now )
})

/* GET /api/reservations/:token
Devuelve la reserva del enlace del correo, para la página "Mi reserva" */
const getReservation = async ( req, res, next ) => {
    try {
        const reservation = await findReservationByToken( req.params.token )
        if ( !reservation ) return fail( res, 404, NOT_FOUND_MESSAGE )

        res.status( 200 ).json({
            message: 'Tu reserva',
            data: toPublicReservation( reservation, getMadridNow() )
        })
    } catch ( error ) {
        next( error )
    }
}

/* PATCH /api/reservations/:token/cancel
Cancela la reserva del enlace del correo, desde la página "Mi reserva".
Es PATCH y no DELETE porque no borramos la reserva: solo cambiamos su estado a 'cancelled'.
- La mesa queda libre igual, porque la disponibilidad solo cuenta las reservas confirmadas.
- Y se conserva el historial: el mesón puede ver qué reservas se cancelaron */
const cancelReservation = async ( req, res, next ) => {
    try {
        const reservation = await findReservationByToken( req.params.token )
        if ( !reservation ) return fail( res, 404, NOT_FOUND_MESSAGE )

        const now = getMadridNow()

        /* Si el cliente pulsa dos veces o repite la petición porque falló la red, no ve un error. Tampoco se reenvía el correo */
        if ( reservation.status === 'cancelled' ) return respondAlreadyCancelled( res, reservation, now )

        /* Se puede cancelar hasta la hora de la reserva. Si ya ha empezado, 409: la petición choca con el estado de la reserva */
        if ( isPastReservation( reservation, now ) ) {
            return fail( res, 409, 'Esta reserva ya ha empezado. Si necesitas algo, llámanos' )
        }

        /* findOneAndUpdate cambia el estado y, con returnDocument: 'after', devuelve la reserva ya actualizada en una sola consulta.
        Filtramos también por status: 'confirmed' para no pisar un cambio que haya llegado entre la lectura y esta escritura */
        const cancelled = await Reservation.findOneAndUpdate(
            { _id: reservation._id, status: 'confirmed' },
            { status: 'cancelled' },
            { returnDocument: 'after' }
        ).lean()

        /* Si no ha cambiado nada, otra petición la canceló justo antes: es el mismo caso de "ya estaba cancelada" */
        if ( !cancelled ) return respondAlreadyCancelled( res, { ...reservation, status: 'cancelled' }, now )

        /* Si el correo falla, la reserva ya está cancelada y se mantiene */
        await sendEmailSafely( () => buildCancellationMessage( cancelled ), 'cancelación' )

        res.status( 200 ).json({
            message: 'Reserva cancelada',
            data: toPublicReservation( cancelled, now )
        })
    } catch ( error ) {
        next( error )
    }
}

/* PATCH /api/reservations/:token
Modifica el día, la hora y las personas de la reserva del enlace del correo, desde la página "Mi reserva".
Los demás datos (nombre, teléfono, correo, notas) no se cambian aquí */
const updateReservation = async ( req, res, next ) => {
    try {
        /* Si la petición llega sin cuerpo JSON, Express 5 deja req.body en undefined: con {} llega a la validación y responde 400 */
        const body = req.body ?? {}
        /* Solo cogemos los campos permitidos: si alguien manda status, table o token, se ignoran */
        const { date, time } = body
        const partySize = Number( body.partySize )

        /* Primero los datos, con los mismos mensajes que al crear, y después el código:
        con datos mal responde 400 aunque el código no exista */
        const error = validateBooking({ date, time, partySize })
        if ( error ) return fail( res, 400, error )

        const now = getMadridNow()
        const daysAheadError = validateDaysAhead( date, now )
        if ( daysAheadError ) return fail( res, 400, daysAheadError )

        const reservation = await findReservationByToken( req.params.token )
        if ( !reservation ) return fail( res, 404, NOT_FOUND_MESSAGE )

        if ( reservation.status === 'cancelled' ) {
            return fail( res, 409, 'Esta reserva está cancelada' )
        }

        /* Se puede modificar hasta la hora de la reserva, mirando la reserva tal como está (no la nueva hora) */
        if ( isPastReservation( reservation, now ) ) {
            return fail( res, 409, 'Esta reserva ya ha empezado. Si necesitas algo, llámanos' )
        }

        /* Si no cambia nada respondemos 200 con el mismo mensaje, para que la página "Mi reserva" lo trate igual,
        pero sin guardar ni enviar correo: no hay nada nuevo que contar. Va antes de mirar las horas libres
        porque su propia hora puede estar ya dentro de las 2 horas de antelación y saldría como no libre */
        if ( reservation.date === date && reservation.time === time && reservation.partySize === partySize ) {
            return res.status( 200 ).json({
                message: 'Reserva modificada',
                data: toPublicReservation( reservation, now )
            })
        }

        /* Las mesas y las reservas del NUEVO día sin contar esta: su mesa actual tiene que poder volver a elegirse
        (por ejemplo, al pasar de 4 a 5 personas a la misma hora) */
        const [ tables, reservations ] = await getDayBookings( date, reservation._id )

        const times = getAvailableTimes({ date, partySize, tables, reservations, now })
        if ( !times.includes( time ) ) return fail( res, 409, NOT_FREE_MESSAGE )

        const table = pickTable({ tables, reservations, time, partySize })

        /* Guardamos el cambio. Filtramos también por status: 'confirmed' para no pisar una cancelación
        que haya llegado entre la lectura y esta escritura.
        reminderSent vuelve a false: el recordatorio se enviará otra vez, para la nueva fecha */
        const updated = await Reservation.findOneAndUpdate(
            { _id: reservation._id, status: 'confirmed' },
            { date, time, partySize, table: table.number, reminderSent: false },
            { returnDocument: 'after' }
        ).lean()

        if ( !updated ) return fail( res, 409, 'Esta reserva está cancelada' )

        /* Si a la vez otra persona reserva o modifica hacia la misma mesa, las dos pueden pasar la comprobación de arriba.
        Después de guardar volvemos a mirar: si choca con otra, devolvemos la reserva a como estaba y avisamos */
        if ( await hasClash( updated ) ) {
            await Reservation.updateOne(
                { _id: reservation._id },
                {
                    date: reservation.date,
                    time: reservation.time,
                    partySize: reservation.partySize,
                    table: reservation.table,
                    reminderSent: reservation.reminderSent
                }
            )
            return fail( res, 409, NOT_FREE_MESSAGE )
        }

        /* Correo de "Reserva modificada" con el evento de calendario actualizado (mismo UID, sequence mayor).
        Si el correo falla, el cambio ya está guardado y se mantiene */
        await sendEmailSafely( () => buildReservationEmail( updated, { isUpdate: true, sequence: getSequence( updated ) } ), 'reserva modificada' )

        res.status( 200 ).json({
            message: 'Reserva modificada',
            data: toPublicReservation( updated, now )
        })
    } catch ( error ) {
        next( error )
    }
}

/* Exportamos los controllers para el router, y TOKEN_PATTERN para los tests */
module.exports = {
    postReservation,
    getReservation,
    cancelReservation,
    updateReservation,
    TOKEN_PATTERN
}
