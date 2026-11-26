
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

module.exports = {
    getMadridNow
}
