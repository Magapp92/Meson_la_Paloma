
/* Controlador de las reservas */
const crypto = require( 'node:crypto' )
const { Table, Reservation } = require( '../models' )
const { getAvailableTimes, getDaySlots, pickTable, parseDate, daysBetween, toMinutes } = require( '../availability' )
const { getMadridNow } = require( '../madrid-time' )
const { BOOKING_RULES } = require( '../booking-rules' )
const { sendEmail } = require( '../mailer' )
const { buildConfirmationEmail } = require( '../emails/confirmation' )
const { buildCalendarEvent } = require( '../emails/calendar-event' )
const { buildCancellationEmail } = require( '../emails/cancellation' )

/* Respuesta de error con el formato de siempre */
const fail = ( res, status, message ) => res.status( status ).json({ message, data: null })

/* Los códigos que genera la API tienen 32 caracteres de [A-Za-z0-9_-]: si no tiene esa forma, ni consultamos la base de datos */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/

/* Comprueba los datos que llegan del formulario. Devuelve el primer error que encuentre, o null si está todo bien */
const validate = ({ date, time, partySize, name, phone, email, notes }) => {
    if ( !parseDate( date ) ) return 'La fecha no es válida: tiene que ser AAAA-MM-DD'
    if ( typeof time !== 'string' || !/^\d{2}:\d{2}$/.test( time ) ) return 'La hora no es válida: tiene que ser HH:MM'
    /* La hora tiene que ser una de las franjas de ese día: descarta los días cerrados y las horas fuera de servicio o sueltas (21:10) */
    if ( !getDaySlots( date ).includes( time ) ) return 'Ese día o a esa hora no se puede reservar. Elige una de las horas disponibles'
    if ( !Number.isInteger( partySize ) || partySize < BOOKING_RULES.minPartySize || partySize > BOOKING_RULES.maxPartySize ) {
        return `Se reserva para ${ BOOKING_RULES.minPartySize } a ${ BOOKING_RULES.maxPartySize } personas. Para grupos más grandes, llámanos`
    }
    if ( typeof name !== 'string' || name.trim().length < 2 ) return 'Escribe tu nombre'
    /* Un teléfono con al menos 9 cifras (puede llevar +, espacios o guiones) */
    if ( typeof phone !== 'string' || phone.replace( /\D/g, '' ).length < 9 ) return 'Escribe un teléfono válido'
    if ( typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test( email.trim() ) ) return 'Escribe un correo válido'
    if ( notes !== undefined && ( typeof notes !== 'string' || notes.length > 500 ) ) return 'Las notas pueden tener como mucho 500 caracteres'

    return null
}

/* ¿Hay otra reserva confirmada, guardada antes que esta, en la misma mesa y a menos de 90 minutos?
"Antes" es con createdAt menor; si coinciden en el mismo milisegundo, desempata el _id (también va en orden).
Así, de dos reservas que chocan, siempre se queda la misma y nunca se anulan las dos */
const hasEarlierClash = async reservation => {
    const others = await Reservation.find({
        _id: { $ne: reservation._id },
        date: reservation.date,
        table: reservation.table,
        status: 'confirmed',
        createdAt: { $lte: reservation.createdAt }
    }).lean()

    const isEarlier = other =>
        other.createdAt < reservation.createdAt || String( other._id ) < String( reservation._id )

    return others.some( other =>
        isEarlier( other ) && Math.abs( toMinutes( other.time ) - toMinutes( reservation.time ) ) < BOOKING_RULES.durationMinutes
    )
}

/* POST /api/reservations
Crea una reserva con los datos del formulario. La mesa, el estado y el código secreto los pone la API */
const postReservation = async ( req, res, next ) => {
    try {
        /* Solo cogemos los campos permitidos: si alguien manda status, table o token, se ignoran */
        const { date, time, name, phone, email, notes } = req.body
        const partySize = Number( req.body.partySize )

        const error = validate({ date, time, partySize, name, phone, email, notes })
        if ( error ) return fail( res, 400, error )

        /* La fecha tiene que estar entre hoy y dentro de maxDaysAhead días (en hora de Madrid) */
        const now = getMadridNow()
        const daysAhead = daysBetween( now.date, date )
        if ( daysAhead < 0 || daysAhead > BOOKING_RULES.maxDaysAhead ) {
            return fail( res, 400, `Se puede reservar desde hoy hasta dentro de ${ BOOKING_RULES.maxDaysAhead } días` )
        }

        /* Las mesas en uso y las reservas confirmadas de ese día */
        const [ tables, reservations ] = await Promise.all([
            Table.find({ active: true }).lean(),
            Reservation.find({ date, status: 'confirmed' }, { table: 1, time: 1, status: 1 }).lean()
        ])

        /* ¿Sigue libre esa hora? Con el mismo cálculo que la disponibilidad: si entre tanto ha pasado
        el margen de 2 horas o se han ocupado las mesas, ya no aparece */
        const times = getAvailableTimes({ date, partySize, tables, reservations, now })
        if ( !times.includes( time ) ) {
            return fail( res, 409, 'Esa hora ya no está libre. Elige otra, por favor' )
        }

        const table = pickTable({ tables, reservations, time, partySize })

        /* Código secreto para el enlace de modificar o cancelar: 24 bytes al azar, en texto apto para una URL */
        const token = crypto.randomBytes( 24 ).toString( 'base64url' )

        const reservation = await Reservation.create({
            date, time, partySize, name, phone, email, notes,
            table: table.number,
            token
        })

        /* Si dos personas reservan la misma mesa a la vez, las dos pueden pasar la comprobación de arriba.
        Después de guardar volvemos a mirar: si otra llegó antes, anulamos esta y avisamos */
        if ( await hasEarlierClash( reservation ) ) {
            await Reservation.deleteOne({ _id: reservation._id })
            return fail( res, 409, 'Esa hora ya no está libre. Elige otra, por favor' )
        }

        /* Correo de confirmación con el enlace a "Mi reserva". Va en su propio try / catch:
        si el correo falla, la reserva ya está guardada y se mantiene; solo lo apuntamos en la consola */
        try {
            const manageUrl = `${ process.env.SITE_URL }/mi-reserva?codigo=${ reservation.token }`
            const { subject, html, text } = buildConfirmationEmail({
                name: reservation.name,
                date: reservation.date,
                time: reservation.time,
                partySize: reservation.partySize,
                notes: reservation.notes,
                manageUrl
            })
            /* Evento de calendario adjunto (.ics): así el programa de correo ofrece "Añadir al calendario" */
            const calendarEvent = buildCalendarEvent({
                uid: `${ reservation.token }@mesonlapaloma.com`,
                title: `Mesa en Mesón La Paloma (${ reservation.partySize } personas)`,
                date: reservation.date,
                time: reservation.time,
                durationMinutes: BOOKING_RULES.durationMinutes,
                timeZone: 'Europe/Madrid',
                location: 'C/ Artajona, 9, 28039 Madrid'
            })
            await sendEmail({
                to: { email: reservation.email, name: reservation.name },
                subject, html, text,
                attachments: [ { name: 'reserva-meson-la-paloma.ics', content: calendarEvent } ]
            })
        } catch ( error ) {
            console.error( 'No se ha podido enviar el correo de confirmación:', error.message )
        }

        res.status( 201 ).json({
            message: 'Reserva confirmada',
            data: {
                date: reservation.date,
                time: reservation.time,
                partySize: reservation.partySize,
                name: reservation.name,
                durationMinutes: BOOKING_RULES.durationMinutes,
                token: reservation.token
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

/* GET /api/reservations/:token
Devuelve la reserva del enlace del correo, para la página "Mi reserva" */
const getReservation = async ( req, res, next ) => {
    try {
        const { token } = req.params

        if ( !TOKEN_PATTERN.test( token ) ) {
            return fail( res, 404, 'No encontramos ninguna reserva con este enlace' )
        }

        const reservation = await Reservation.findOne({ token }).lean()
        if ( !reservation ) return fail( res, 404, 'No encontramos ninguna reserva con este enlace' )

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
        const { token } = req.params

        /* Mismo 404 que al leer: un código mal formado o que no existe se tratan igual */
        if ( !TOKEN_PATTERN.test( token ) ) {
            return fail( res, 404, 'No encontramos ninguna reserva con este enlace' )
        }

        const reservation = await Reservation.findOne({ token }).lean()
        if ( !reservation ) return fail( res, 404, 'No encontramos ninguna reserva con este enlace' )

        const now = getMadridNow()

        /* Si ya estaba cancelada respondemos 200, no un error: el resultado que se pide (que esté cancelada) ya se cumple.
        Así, si el cliente pulsa dos veces o repite la petición porque falló la red, no ve un error. Tampoco se reenvía el correo */
        if ( reservation.status === 'cancelled' ) {
            return res.status( 200 ).json({
                message: 'La reserva ya estaba cancelada',
                data: toPublicReservation( reservation, now )
            })
        }

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
        if ( !cancelled ) {
            return res.status( 200 ).json({
                message: 'La reserva ya estaba cancelada',
                data: toPublicReservation({ ...reservation, status: 'cancelled' }, now )
            })
        }

        /* Correo de cancelación con el enlace para reservar otra vez. Va en su propio try / catch:
        si el correo falla, la reserva ya está cancelada y se mantiene; solo lo apuntamos en la consola */
        try {
            const { subject, html, text } = buildCancellationEmail({
                name: cancelled.name,
                date: cancelled.date,
                time: cancelled.time,
                partySize: cancelled.partySize,
                bookingUrl: `${ process.env.SITE_URL }/reservar`
            })
            await sendEmail({
                to: { email: cancelled.email, name: cancelled.name },
                subject, html, text
            })
        } catch ( error ) {
            console.error( 'No se ha podido enviar el correo de cancelación:', error.message )
        }

        res.status( 200 ).json({
            message: 'Reserva cancelada',
            data: toPublicReservation( cancelled, now )
        })
    } catch ( error ) {
        next( error )
    }
}

/* Exportamos los controllers para el router */
module.exports = {
    postReservation,
    getReservation,
    cancelReservation
}
