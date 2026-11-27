
/* Correo de recordatorio que recibe el cliente unas 24 horas antes de su reserva. Es una función pura,
como los de confirmación y cancelación: recibe los datos de la reserva y devuelve el asunto y el cuerpo
(en HTML y en texto plano). No lleva invitación de calendario: ya la tiene del correo de confirmación */
const { STYLES } = require( './styles' )
const { escapeHtml, formatLongDate } = require( './format' )
const { RESTAURANT, emailLayout, paragraph, heading, details, detailRow, button, helpLine } = require( './layout' )

/* Monta el correo de recordatorio.
- name: lo escribe el cliente, va escapado en el HTML.
- date 'AAAA-MM-DD', time 'HH:MM', partySize: los datos de la reserva.
- manageUrl: el enlace para ver, cambiar o cancelar la reserva.
Devuelve { subject, html, text } */
const buildReminderEmail = ({ name, date, time, partySize, manageUrl }) => {
    const longDate = formatLongDate( date )
    const people = `${ partySize } ${ partySize === 1 ? 'persona' : 'personas' }`
    const title = 'Te esperamos mañana'
    const cancelNote = 'Si al final no podéis venir, cancélala desde el botón y la mesa quedará libre para otras personas.'

    const subject = `${ title }: ${ longDate } a las ${ time }`

    /* El cuerpo en HTML: título, saludo, frase, datos, botón, aviso para cancelar y ayuda */
    const html = emailLayout({
        title: subject,
        content: [
            heading( title ),
            paragraph( STYLES.greetingBeforeText, `Hola, ${ escapeHtml( name ) }:` ),
            paragraph( STYLES.text, 'Te recordamos tu reserva:' ),
            details([
                detailRow( 'Día', longDate ),
                detailRow( 'Hora', time ),
                detailRow( 'Personas', people )
            ]),
            button( manageUrl, 'Ver o cambiar mi reserva' ),
            paragraph( STYLES.note, cancelNote ),
            helpLine()
        ]
    })

    /* La misma información en texto plano, para los programas de correo que no muestran HTML */
    const text = [
        `${ RESTAURANT.name.toUpperCase() }`,
        '',
        title,
        '',
        `Hola, ${ name }:`,
        '',
        'Te recordamos tu reserva:',
        '',
        `Día: ${ longDate }`,
        `Hora: ${ time }`,
        `Personas: ${ people }`,
        '',
        `Ver o cambiar mi reserva: ${ manageUrl }`,
        '',
        cancelNote,
        '',
        `Si necesitas algo, llámanos al ${ RESTAURANT.phone }`,
        '',
        `${ RESTAURANT.name } · ${ RESTAURANT.address }`
    ].join( '\n' )

    return { subject, html, text }
}

/* Exportamos el correo para reservation-emails.js */
module.exports = {
    buildReminderEmail
}
