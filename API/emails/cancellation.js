
/* Correo que recibe el cliente cuando cancela su reserva. Es una función pura, como el de confirmación:
recibe los datos de la reserva y devuelve el asunto y el cuerpo (en HTML y en texto plano).
Tiene el mismo diseño que el correo de confirmación para que el cliente lo reconozca como del mesón */
const { formatLongDate, escapeHtml } = require( './confirmation' )

/* Datos del mesón que salen en el correo */
const RESTAURANT = Object.freeze({
    name: 'Mesón La Paloma',
    address: 'C/ Artajona, 9 · 28039 Madrid',
    phone: '608 83 65 64',
    phoneHref: 'tel:+34608836564'
})

/* Colores y fuentes de la web, los mismos que en el correo de confirmación */
const COLORS = Object.freeze({
    background: '#0E0E0D',
    box: '#161513',
    cream: '#F5F1E8',
    grey: '#C9C2B4',
    mustard: '#F0B429'
})

const TITLE_FONT = "Anton, Impact, 'Arial Narrow', sans-serif"
const TEXT_FONT = "'Inter Tight', Arial, sans-serif"

/* Una fila de datos de la reserva en el HTML: etiqueta en gris y valor en crema */
const detailRow = ( label, value ) => `
                <tr>
                    <td style="padding: 6px 0; font-family: ${ TEXT_FONT }; font-size: 14px; color: ${ COLORS.grey }; width: 90px; vertical-align: top;">${ label }</td>
                    <td style="padding: 6px 0; font-family: ${ TEXT_FONT }; font-size: 16px; color: ${ COLORS.cream }; font-weight: bold;">${ value }</td>
                </tr>`

/* Monta el correo de cancelación.
- name: lo escribe el cliente, va escapado en el HTML.
- date 'AAAA-MM-DD', time 'HH:MM', partySize: los datos de la reserva cancelada.
- bookingUrl: el enlace para hacer otra reserva.
Devuelve { subject, html, text } */
const buildCancellationEmail = ({ name, date, time, partySize, bookingUrl }) => {
    const longDate = formatLongDate( date )
    const people = `${ partySize } ${ partySize === 1 ? 'persona' : 'personas' }`

    const subject = `Reserva cancelada: ${ longDate } a las ${ time }`

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${ escapeHtml( subject ) }</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${ COLORS.background };">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${ COLORS.background };">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: ${ COLORS.box };">
                    <tr>
                        <td style="padding: 32px 32px 8px; font-family: ${ TITLE_FONT }; font-size: 22px; letter-spacing: 1px; text-transform: uppercase; color: ${ COLORS.cream };">
                            MESÓN <span style="color: ${ COLORS.mustard };">LA PALOMA</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 32px 8px; font-family: ${ TITLE_FONT }; font-size: 32px; line-height: 1.1; text-transform: uppercase; color: ${ COLORS.cream };">
                            Reserva cancelada
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 32px 8px; font-family: ${ TEXT_FONT }; font-size: 16px; color: ${ COLORS.cream };">
                            Hola, ${ escapeHtml( name ) }:
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 16px; font-family: ${ TEXT_FONT }; font-size: 16px; color: ${ COLORS.cream };">
                            Hemos cancelado tu reserva:
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ detailRow( 'Día', escapeHtml( longDate ) ) }${ detailRow( 'Hora', escapeHtml( time ) ) }${ detailRow( 'Personas', escapeHtml( people ) ) }
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 24px;">
                            <a href="${ escapeHtml( bookingUrl ) }" style="display: inline-block; padding: 14px 24px; background-color: ${ COLORS.mustard }; color: #000000; font-family: ${ TEXT_FONT }; font-size: 16px; font-weight: bold; text-decoration: none;">Hacer otra reserva</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 32px; font-family: ${ TEXT_FONT }; font-size: 14px; color: ${ COLORS.grey };">
                            Si necesitas algo, llámanos al <a href="${ RESTAURANT.phoneHref }" style="color: ${ COLORS.mustard }; text-decoration: none;">${ RESTAURANT.phone }</a>
                        </td>
                    </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px;">
                    <tr>
                        <td align="center" style="padding: 16px 32px; font-family: ${ TEXT_FONT }; font-size: 12px; color: ${ COLORS.grey };">
                            ${ RESTAURANT.name } · ${ RESTAURANT.address }
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

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
