
/* Añadir una reserva al calendario con dos enlaces, sin servicios externos y sin descargar nada:
- getGoogleCalendarUrl: abre Google Calendar con el evento ya rellenado.
- getOutlookCalendarUrl: abre Outlook en la web con el evento ya rellenado */

/* Pone un número con dos cifras: 9 → '09' */
const pad = number => String( number ).padStart( 2, '0' )

/* Fecha y hora juntas, sin separadores: ( '2026-11-28', 1260 minutos ) → '20261128T210000' */
const toCompactDateTime = ( date, minutes ) => `${ date.replaceAll( '-', '' ) }T${ pad( Math.floor( minutes / 60 ) ) }${ pad( minutes % 60 ) }00`

/* Hora 'HH:MM' en minutos desde las 00:00: '21:00' → 1260 */
const toMinutes = time => {
    const [ hours, minutes ] = time.split( ':' ).map( Number )

    return hours * 60 + minutes
}

/* Desfase de la zona horaria ese día: ( '2026-11-28', 'Europe/Madrid' ) → '+01:00' (en verano, '+02:00').
Intl lo da como 'GMT+01:00'; en la hora universal da solo 'GMT', que es '+00:00' */
const getTimeZoneOffset = ( date, timeZone ) => {
    const formatter = new Intl.DateTimeFormat( 'en-US', { timeZone, timeZoneName: 'longOffset' })
    const zoneName = formatter
        .formatToParts( new Date( `${ date }T12:00:00Z` ) )
        .find( part => part.type === 'timeZoneName' ).value

    return zoneName.replace( 'GMT', '' ) || '+00:00'
}

/* Fecha y hora en ISO 8601 con el desfase: ( '2026-11-28', 1260, '+01:00' ) → '2026-11-28T21:00:00+01:00' */
const toIsoDateTime = ( date, minutes, offset ) => `${ date }T${ pad( Math.floor( minutes / 60 ) ) }:${ pad( minutes % 60 ) }:00${ offset }`

/* Enlace que abre Google Calendar con el evento ya rellenado, listo para guardarlo.
Las horas van sin zona: Google las interpreta en la zona que indica ctz (por ejemplo 'Europe/Madrid') */
export const getGoogleCalendarUrl = ({ title, date, time, durationMinutes, timeZone, location }) => {
    const start = toMinutes( time )
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${ toCompactDateTime( date, start ) }/${ toCompactDateTime( date, start + durationMinutes ) }`,
        ctz: timeZone,
        location
    })

    return `https://calendar.google.com/calendar/render?${ params }`
}

/* Enlace que abre Outlook en la web con el evento ya rellenado, listo para guardarlo.
outlook.live.com es el Outlook personal (Hotmail / Outlook.com).
Las horas llevan el desfase de la zona: sin él, Outlook las interpretaría en la hora del dispositivo */
export const getOutlookCalendarUrl = ({ title, date, time, durationMinutes, timeZone, location }) => {
    const start = toMinutes( time )
    const offset = getTimeZoneOffset( date, timeZone )
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: title,
        startdt: toIsoDateTime( date, start, offset ),
        enddt: toIsoDateTime( date, start + durationMinutes, offset ),
        location
    })

    return `https://outlook.live.com/calendar/0/deeplink/compose?${ params }`
}
