
/* Correo de confirmación de una reserva. Es una función pura: recibe los datos de la reserva
y devuelve el asunto y el cuerpo (en HTML y en texto plano), sin leer el reloj ni el entorno.
Aquí solo está el contenido; el diseño común está en layout.js y los estilos en styles.js */
const { STYLES } = require( './styles' )
const { escapeHtml, formatLongDate } = require( './format' )
const { RESTAURANT, emailLayout, paragraph, heading, details, detailRow, button, helpLine } = require( './layout' )

/* Monta el correo de confirmación.
- name, notes: los escribe el cliente, van escapados en el HTML.
- date 'AAAA-MM-DD', time 'HH:MM', partySize: los datos de la reserva.
- manageUrl: el enlace para ver, cambiar o cancelar la reserva.
- isUpdate (opcional): true si el cliente ha modificado la reserva. Cambia el asunto y el título
a "Reserva modificada" y añade una frase antes de los datos; el resto del correo es el mismo.
Devuelve { subject, html, text } */
const buildConfirmationEmail = ({ name, date, time, partySize, notes, manageUrl, isUpdate = false }) => {
    const longDate = formatLongDate( date )
    const people = `${ partySize } ${ partySize === 1 ? 'persona' : 'personas' }`
    const hasNotes = typeof notes === 'string' && notes.trim() !== ''
    const title = isUpdate ? 'Reserva modificada' : 'Reserva confirmada'
    const updateIntro = 'Estos son los datos nuevos de tu reserva:'
    const calendarNote = 'Este correo incluye la invitación de calendario: añádela y se actualizará sola si cambias o cancelas la reserva.'

    const subject = `${ title }: ${ longDate } a las ${ time }`

    /* El cuerpo en HTML: título, saludo, (frase si es una modificación), datos, botón, aviso del calendario y ayuda */
    const html = emailLayout({
        title: subject,
        content: [
            heading( title ),
            paragraph( STYLES.greeting, `Hola, ${ escapeHtml( name ) }:` ),
            isUpdate ? paragraph( STYLES.text, updateIntro ) : '',
            details([
                detailRow( 'Día', longDate ),
                detailRow( 'Hora', time ),
                detailRow( 'Personas', people ),
                hasNotes ? detailRow( 'Notas', notes ) : ''
            ]),
            button( manageUrl, 'Ver o cambiar mi reserva' ),
            paragraph( STYLES.note, calendarNote ),
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
        ...( isUpdate ? [ updateIntro, '' ] : [] ),
        `Día: ${ longDate }`,
        `Hora: ${ time }`,
        `Personas: ${ people }`,
        ...( hasNotes ? [ `Notas: ${ notes }` ] : [] ),
        '',
        `Ver o cambiar mi reserva: ${ manageUrl }`,
        '',
        calendarNote,
        '',
        `Si necesitas algo, llámanos al ${ RESTAURANT.phone }`,
        '',
        `${ RESTAURANT.name } · ${ RESTAURANT.address }`
    ].join( '\n' )

    return { subject, html, text }
}

/* Exportamos el correo para los controllers. formatLongDate y escapeHtml viven en format.js,
pero se siguen exportando desde aquí para los tests y para quien ya los importaba de este archivo */
module.exports = {
    buildConfirmationEmail,
    formatLongDate,
    escapeHtml
}
