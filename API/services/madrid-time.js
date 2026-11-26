
/* La fecha y la hora de ahora en Madrid, aunque el servidor esté en otra zona horaria.
Va aparte del cálculo de horas libres (availability.js) porque lee el reloj, y el cálculo no debe leerlo */
const TIME_ZONE = 'Europe/Madrid'

/* Devuelve { date: 'AAAA-MM-DD', time: 'HH:MM' }.
Intl.DateTimeFormat escribe la fecha en la zona de Madrid y formatToParts la da por trozos (año, mes…) */
const getMadridNow = ( now = new Date() ) => {
    const parts = new Intl.DateTimeFormat( 'en-GB', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts( now )

    /* Pasamos la lista de trozos a un objeto: { year: '2026', month: '11', … } */
    const part = Object.fromEntries( parts.map( ({ type, value }) => [ type, value ] ) )

    return {
        date: `${ part.year }-${ part.month }-${ part.day }`,
        time: `${ part.hour }:${ part.minute }`
    }
}

/* El instante real en que empieza en Madrid el día siguiente a date ('AAAA-MM-DD'): las 00:00 de Madrid de ese día.
Es el momento en que se borra la reserva (expiresAt): una reserva del día 11 se borra al empezar el día 12.
Madrid va 1 hora por delante de la hora universal en invierno y 2 en verano, así que no basta con restar una hora fija:
- Tomamos las 00:00 universales del día siguiente y miramos qué hora es en Madrid en ese instante (01:00 o 02:00).
- Esa diferencia es el desfase de ese día, y se lo restamos: 00:00 de Madrid = 23:00 o 22:00 universales del día anterior.
El cambio de hora en Madrid es siempre a la 01:00 universal, nunca entre las 22:00 y las 00:00 universales:
el desfase que medimos es el mismo que hay a las 00:00 de Madrid, también los días del cambio */
const getStartOfNextDayInMadrid = date => {
    const [ year, month, day ] = date.split( '-' ).map( Number )
    /* Date.UTC pasa bien de mes y de año: el día 32 es el 1 del mes siguiente */
    const midnightUtc = Date.UTC( year, month - 1, day + 1 )
    const madrid = getMadridNow( new Date( midnightUtc ) )
    const offset = Date.parse( `${ madrid.date }T${ madrid.time }:00Z` ) - midnightUtc

    return new Date( midnightUtc - offset )
}

module.exports = {
    getMadridNow,
    getStartOfNextDayInMadrid
}
