
/* Añadir una reserva al calendario, sin servicios externos:
- getGoogleCalendarUrl: un enlace que abre Google Calendar con el evento ya rellenado.
- downloadCalendarEvent: crea el evento como archivo .ics (el formato que abren Apple Calendar y Outlook) y lo descarga */

/* Pone un número con dos cifras: 9 → '09' */
const pad = number => String( number ).padStart( 2, '0' )

/* Fecha y hora en el formato del .ics: ( '2026-11-28', 1260 minutos ) → '20261128T210000' */
const toIcsDateTime = ( date, minutes ) => `${ date.replaceAll( '-', '' ) }T${ pad( Math.floor( minutes / 60 ) ) }${ pad( minutes % 60 ) }00`

/* En los textos del .ics, la barra, la coma y el punto y coma tienen significado: se escapan con \ */
const escapeText = text => text.replace( /[\\,;]/g, character => `\\${ character }` )

/* Hora 'HH:MM' en minutos desde las 00:00: '21:00' → 1260 */
const toMinutes = time => {
    const [ hours, minutes ] = time.split( ':' ).map( Number )

    return hours * 60 + minutes
}

/* Enlace que abre Google Calendar con el evento ya rellenado, listo para guardarlo.
Las horas van sin zona: Google las interpreta en la zona que indica ctz (por ejemplo 'Europe/Madrid') */
export const getGoogleCalendarUrl = ({ title, date, time, durationMinutes, timeZone, location }) => {
    const start = toMinutes( time )
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${ toIcsDateTime( date, start ) }/${ toIcsDateTime( date, start + durationMinutes ) }`,
        ctz: timeZone,
        location
    })

    return `https://calendar.google.com/calendar/render?${ params }`
}

/* date 'AAAA-MM-DD', time 'HH:MM', durationMinutes y timeZone (por ejemplo 'Europe/Madrid') */
export const downloadCalendarEvent = ({ title, date, time, durationMinutes, timeZone, location, fileName }) => {
    const start = toMinutes( time )

    /* Momento en que se crea el evento, en hora universal: '20261126T101500Z' */
    const stamp = new Date().toISOString().replace( /[-:]/g, '' ).replace( /\.\d{3}/, '' )

    /* Cada línea es una propiedad del evento. UID lo identifica: uno al azar para cada archivo */
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Meson La Paloma//Reservas//ES',
        'BEGIN:VEVENT',
        `UID:${ crypto.randomUUID() }`,
        `DTSTAMP:${ stamp }`,
        `DTSTART;TZID=${ timeZone }:${ toIcsDateTime( date, start ) }`,
        `DTEND;TZID=${ timeZone }:${ toIcsDateTime( date, start + durationMinutes ) }`,
        `SUMMARY:${ escapeText( title ) }`,
        `LOCATION:${ escapeText( location ) }`,
        'END:VEVENT',
        'END:VCALENDAR'
    ]

    /* El formato pide las líneas separadas por \r\n. Blob crea el archivo en memoria
    y un enlace temporal con download lo descarga con ese nombre */
    const file = new Blob([ lines.join( '\r\n' ) ], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL( file )
    const link = document.createElement( 'a' )

    link.href = url
    link.download = fileName
    link.click()

    /* Se libera la memoria del archivo un momento después, cuando la descarga ya ha empezado */
    setTimeout( () => URL.revokeObjectURL( url ), 1000 )
}
