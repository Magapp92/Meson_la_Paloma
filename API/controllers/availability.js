
/* Controlador de la disponibilidad: qué horas quedan libres un día para un número de personas */
const { Table, Reservation } = require( '../models' )
const { getAvailableTimes, getOpenDays, parseDate } = require( '../availability' )
const { getMadridNow } = require( '../madrid-time' )
const { BOOKING_RULES } = require( '../booking-rules' )

/* GET /api/availability?date=AAAA-MM-DD&partySize=4
Devuelve { date, partySize, times }: times es la lista de horas libres ('13:00', '13:15'…) */
const getAvailability = async ( req, res, next ) => {
    try {
        const { date } = req.query
        const partySize = Number( req.query.partySize )

        /* Comprobamos los parámetros antes de ir a la base de datos: si faltan o están mal, 400 */
        if ( !parseDate( date ) ) {
            return res.status( 400 ).json({
                message: 'La fecha no es válida: tiene que ser AAAA-MM-DD',
                data: null
            })
        }

        if ( !Number.isInteger( partySize ) || partySize < BOOKING_RULES.minPartySize || partySize > BOOKING_RULES.maxPartySize ) {
            return res.status( 400 ).json({
                message: `Se reserva para ${ BOOKING_RULES.minPartySize } a ${ BOOKING_RULES.maxPartySize } personas. Para grupos más grandes, llámanos`,
                data: null
            })
        }

        /* Pedimos a la vez las mesas en uso y las reservas confirmadas de ese día.
        lean() devuelve objetos sencillos, más rápidos, porque solo los vamos a leer */
        const [ tables, reservations ] = await Promise.all([
            Table.find({ active: true }).lean(),
            Reservation.find({ date, status: 'confirmed' }, { table: 1, time: 1, status: 1 }).lean()
        ])

        const times = getAvailableTimes({ date, partySize, tables, reservations, now: getMadridNow() })

        res.status( 200 ).json({
            message: `Horas libres el ${ date } para ${ partySize } personas`,
            data: { date, partySize, times }
        })
    } catch ( error ) {
        next( error )
    }
}

/* GET /api/days
Devuelve { days }: los días en los que se puede reservar ('2026-11-25', '2026-11-26'…), en hora de Madrid */
const getDays = ( req, res ) => {
    const days = getOpenDays( getMadridNow() )

    res.status( 200 ).json({
        message: 'Días en los que se puede reservar',
        data: { days }
    })
}

/* Exportamos los controllers para el router */
module.exports = {
    getAvailability,
    getDays
}
