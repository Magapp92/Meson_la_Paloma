
/* Controlador de las reservas */
const crypto = require( 'node:crypto' )
const { Table, Reservation } = require( '../models' )
const { getAvailableTimes, getDaySlots, pickTable, parseDate, daysBetween, toMinutes } = require( '../availability' )
const { getMadridNow } = require( '../madrid-time' )
const { BOOKING_RULES } = require( '../booking-rules' )

/* Respuesta de error con el formato de siempre */
const fail = ( res, status, message ) => res.status( status ).json({ message, data: null })

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

/* Exportamos los controllers para el router */
module.exports = {
    postReservation
}
