
/* Evento de calendario (.ics) que va adjunto al correo de confirmación. Con él, Apple Mail, Gmail
y Outlook ofrecen "Añadir al calendario". Es una función pura: recibe los datos y el "ahora", y
devuelve el texto del archivo. El formato es iCalendar (RFC 5545): texto plano, una propiedad por
línea con la forma NOMBRE:valor, dentro de bloques BEGIN:… / END:… */

/* El estándar exige que cada línea termine en \r\n (retorno de carro + salto de línea), no solo
en \n. Algunos calendarios son tolerantes, pero otros rechazan el archivo si no se cumple */
const LINE_BREAK = '\r\n'

/* Rellena con un cero a la izquierda hasta dos cifras: 5 → '05' */
const pad = number => String( number ).padStart( 2, '0' )

/* Pasa una hora 'HH:MM' a minutos desde las 00:00: '21:00' → 1260 */
const minutesFromTime = time => {
    const [ hours, minutes ] = time.split( ':' ).map( Number )

    return hours * 60 + minutes
}

/* Junta una fecha 'AAAA-MM-DD' y unos minutos desde las 00:00 en el formato de iCalendar
'AAAAMMDDTHHMMSS': ( '2026-11-28', 1260 ) → '20261128T210000'.
Se calcula en UTC solo como aritmética, para que si los minutos pasan de medianoche cambie el día
y la zona horaria del servidor no influya; la zona real la indica TZID en la línea del evento */
const formatLocalDateTime = ( date, minutes ) => {
    const [ year, month, day ] = date.split( '-' ).map( Number )
    const moment = new Date( Date.UTC( year, month - 1, day, 0, minutes ) )

    return `${ moment.getUTCFullYear() }${ pad( moment.getUTCMonth() + 1 ) }${ pad( moment.getUTCDate() ) }` +
        `T${ pad( moment.getUTCHours() ) }${ pad( moment.getUTCMinutes() ) }00`
}

/* Escribe un instante en UTC con la Z final que lo indica: '20261126T101500Z' */
const formatUtcDateTime = moment =>
    `${ moment.getUTCFullYear() }${ pad( moment.getUTCMonth() + 1 ) }${ pad( moment.getUTCDate() ) }` +
    `T${ pad( moment.getUTCHours() ) }${ pad( moment.getUTCMinutes() ) }${ pad( moment.getUTCSeconds() ) }Z`

/* Escapa un texto para iCalendar. La barra invertida, la coma y el punto y coma tienen significado
en el formato (separan valores y parámetros), así que llevan una barra delante; los saltos de
línea se escriben como \n para que el texto siga en una sola línea del archivo */
const escapeText = value => String( value )
    .replace( /\\/g, '\\\\' )
    .replace( /,/g, '\\,' )
    .replace( /;/g, '\\;' )
    .replace( /\r?\n/g, '\\n' )

/* Monta el texto del .ics.
- uid: identificador único del evento. Si se repite, el calendario lo trata como el mismo evento.
- title, location: textos que se muestran, van escapados.
- date 'AAAA-MM-DD', time 'HH:MM', durationMinutes: cuándo empieza y cuánto dura.
- timeZone: zona horaria de la fecha y la hora, por ejemplo 'Europe/Madrid'.
- now: el momento en que se genera el archivo; por defecto, ahora mismo.
Devuelve el texto del archivo */
const buildCalendarEvent = ({ uid, title, date, time, durationMinutes, timeZone, location, now = new Date() }) => {
    const startMinutes = minutesFromTime( time )

    const lines = [
        /* Abre el calendario: versión del formato, quién lo genera y el tipo de calendario */
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Meson La Paloma//Reservas//ES',
        'CALSCALE:GREGORIAN',
        /* PUBLISH: es un evento para añadir al calendario, no una invitación a la que haya que
        responder (eso sería REQUEST, y el cliente de correo pediría aceptar o rechazar) */
        'METHOD:PUBLISH',
        /* El evento en sí */
        'BEGIN:VEVENT',
        `UID:${ uid }`,
        /* DTSTAMP: cuándo se generó el evento, siempre en UTC */
        `DTSTAMP:${ formatUtcDateTime( now ) }`,
        /* Inicio y fin en hora local con TZID: así las 21:00 son las 21:00 de Madrid aunque quien
        lo abra tenga el móvil en otra zona horaria, y se respeta el cambio de hora de verano */
        `DTSTART;TZID=${ timeZone }:${ formatLocalDateTime( date, startMinutes ) }`,
        `DTEND;TZID=${ timeZone }:${ formatLocalDateTime( date, startMinutes + durationMinutes ) }`,
        `SUMMARY:${ escapeText( title ) }`,
        `LOCATION:${ escapeText( location ) }`,
        'END:VEVENT',
        'END:VCALENDAR'
    ]

    return lines.join( LINE_BREAK ) + LINE_BREAK
}

/* Exportamos el evento para el correo de confirmación */
module.exports = {
    buildCalendarEvent
}
