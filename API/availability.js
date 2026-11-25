
/* Cálculo de las horas libres para reservar. Son funciones puras: reciben los datos (mesas, reservas,
la fecha y la hora de ahora) y devuelven un resultado, sin leer la base de datos ni el reloj.
Así se pueden probar con datos inventados (availability.test.js) */
const { BOOKING_RULES } = require( './booking-rules' )

const MS_PER_DAY = 24 * 60 * 60 * 1000

/* Pasa una hora 'HH:MM' a minutos desde las 00:00: '13:15' → 795 */
const toMinutes = time => {
    const [ hours, minutes ] = time.split( ':' ).map( Number )

    return hours * 60 + minutes
}

/* Pasa minutos desde las 00:00 a una hora 'HH:MM': 795 → '13:15' */
const toTime = minutes => {
    const hours = String( Math.floor( minutes / 60 ) ).padStart( 2, '0' )
    const rest = String( minutes % 60 ).padStart( 2, '0' )

    return `${ hours }:${ rest }`
}

/* Convierte una fecha 'AAAA-MM-DD' en un Date a las 00:00 en hora universal (UTC).
Trabajar en UTC evita que la zona horaria del servidor cambie el día. Si la fecha no existe, null */
const parseDate = date => {
    if ( !/^\d{4}-\d{2}-\d{2}$/.test( date ) ) return null

    const parsed = new Date( `${ date }T00:00:00Z` )

    /* new Date acepta fechas imposibles (2026-02-30 pasa a 2 de marzo): las descartamos */
    return parsed.toISOString().startsWith( date ) ? parsed : null
}

/* Días que hay entre dos fechas 'AAAA-MM-DD' (de from a to) */
const daysBetween = ( from, to ) => ( parseDate( to ) - parseDate( from ) ) / MS_PER_DAY

/* Todas las horas de entrada de un día, según los servicios de ese día de la semana.
Un martes: 13:00, 13:15 … 16:00 y 19:00 … 22:00. Un lunes: ninguna */
const getDaySlots = date => {
    const parsed = parseDate( date )
    if ( !parsed ) return []

    const services = BOOKING_RULES.servicesByDay[ parsed.getUTCDay() ]
    const slots = []

    services.forEach( serviceName => {
        const { first, last } = BOOKING_RULES.services[ serviceName ]

        for ( let minutes = toMinutes( first ); minutes <= toMinutes( last ); minutes += BOOKING_RULES.slotMinutes ) {
            slots.push( toTime( minutes ) )
        }
    })

    return slots
}

/* ¿Choca una hora con una reserva? Cada reserva ocupa su mesa durationMinutes (90) desde su hora.
Dos reservas en la misma mesa chocan si empiezan a menos de 90 minutos una de otra */
const overlaps = ( time, reservationTime ) =>
    Math.abs( toMinutes( time ) - toMinutes( reservationTime ) ) < BOOKING_RULES.durationMinutes

/* Elige la mesa para una reserva: la más pequeña que valga entre las que están libres a esa hora.
Si hay varias del mismo tamaño, la de número más bajo. Si no hay ninguna, null */
const pickTable = ({ tables, reservations, time, partySize }) => {
    /* Números de las mesas ocupadas a esa hora por alguna reserva confirmada */
    const busy = reservations
        .filter( reservation => reservation.status !== 'cancelled' && overlaps( time, reservation.time ) )
        .map( reservation => reservation.table )

    const candidates = tables
        .filter( table => table.active !== false && table.seats >= partySize && !busy.includes( table.number ) )
        .sort( ( a, b ) => a.seats - b.seats || a.number - b.number )

    return candidates[ 0 ] || null
}

/* Horas libres para reservar un día con un número de personas.
- tables: las mesas.
- reservations: las reservas de ese día.
- now: el momento actual en Madrid, como { date: 'AAAA-MM-DD', time: 'HH:MM' }.
Devuelve la lista de horas en las que queda alguna mesa que valga */
const getAvailableTimes = ({ date, partySize, tables, reservations, now }) => {
    /* Fuera de las reglas: ninguna hora */
    if ( partySize < BOOKING_RULES.minPartySize || partySize > BOOKING_RULES.maxPartySize ) return []
    if ( !parseDate( date ) ) return []

    const daysAhead = daysBetween( now.date, date )
    if ( daysAhead < 0 || daysAhead > BOOKING_RULES.maxDaysAhead ) return []

    /* Antelación mínima: las horas de hoy tienen que estar al menos minNoticeMinutes por delante de ahora */
    const minMinutes = daysAhead === 0 ? toMinutes( now.time ) + BOOKING_RULES.minNoticeMinutes : 0

    return getDaySlots( date )
        .filter( time => toMinutes( time ) >= minMinutes )
        .filter( time => pickTable({ tables, reservations, time, partySize }) )
}

module.exports = {
    toMinutes,
    toTime,
    parseDate,
    daysBetween,
    getDaySlots,
    pickTable,
    getAvailableTimes
}
