
/* Correo que recibe el cliente cuando cancela su reserva. Es una función pura, como el de confirmación:
recibe los datos de la reserva y devuelve el asunto y el cuerpo (en HTML y en texto plano).
Usa el mismo diseño (layout.js) que el correo de confirmación para que el cliente lo reconozca como del mesón */
const { STYLES } = require( './styles' )
const { escapeHtml, formatLongDate } = require( './format' )
const { RESTAURANT, emailLayout, paragraph, heading, details, detailRow, button, helpLine } = require( './layout' )

/* Monta el correo de cancelación.
- name: lo escribe el cliente, va escapado en el HTML.
- date 'AAAA-MM-DD', time 'HH:MM', partySize: los datos de la reserva cancelada.
- bookingUrl: el enlace para hacer otra reserva.
Devuelve { subject, html, text } */
const buildCancellationEmail = ({ name, date, time, partySize, bookingUrl }) => {
    const longDate = formatLongDate( date )
    const people = `${ partySize } ${ partySize === 1 ? 'persona' : 'personas' }`
    const calendarNote = 'Si añadiste la reserva a tu calendario, la invitación de este correo la quita.'

    const subject = `Reserva cancelada: ${ longDate } a las ${ time }`

    /* El cuerpo en HTML: título, saludo, frase, datos, botón para reservar otra vez, aviso del calendario y ayuda */
    const html = emailLayout({
        title: subject,
        content: [
            heading( 'Reserva cancelada' ),
            paragraph( STYLES.greetingBeforeText, `Hola, ${ escapeHtml( name ) }:` ),
            paragraph( STYLES.text, 'Hemos cancelado tu reserva:' ),
            details([
                detailRow( 'Día', longDate ),
                detailRow( 'Hora', time ),
                detailRow( 'Personas', people )
            ]),
            button( bookingUrl, 'Hacer otra reserva' ),
            paragraph( STYLES.note, calendarNote ),
            helpLine()
        ]
    })

    /* La misma información en texto plano, para los programas de correo que no muestran HTML */
    const text = [
        `${ RESTAURANT.name.toUpperCase() }`,
        '',
        'Reserva cancelada',
        '',
        `Hola, ${ name }:`,
        '',
        'Hemos cancelado tu reserva:',
        '',
        `Día: ${ longDate }`,
        `Hora: ${ time }`,
        `Personas: ${ people }`,
        '',
        `Hacer otra reserva: ${ bookingUrl }`,
        '',
        calendarNote,
        '',
        `Si necesitas algo, llámanos al ${ RESTAURANT.phone }`,
        '',
        `${ RESTAURANT.name } · ${ RESTAURANT.address }`
    ].join( '\n' )

    return { subject, html, text }
}

/* Exportamos el correo para el controller de reservas */
module.exports = {
    buildCancellationEmail
}
