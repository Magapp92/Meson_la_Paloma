
/* Correo de confirmación de una reserva. Es una función pura: recibe los datos de la reserva
y devuelve el asunto y el cuerpo (en HTML y en texto plano), sin leer el reloj ni el entorno.
El HTML usa tablas y estilos en línea porque Gmail y Outlook ignoran casi todo el CSS de <style> y las clases */

/* Datos del mesón que salen en el correo */
const RESTAURANT = Object.freeze({
    name: 'Mesón La Paloma',
    address: 'C/ Artajona, 9 · 28039 Madrid',
    phone: '608 83 65 64',
    phoneHref: 'tel:+34608836564'
})

/* Colores y fuentes de la web, para que el correo se reconozca como del mesón */
const COLORS = Object.freeze({
    background: '#0E0E0D',
    box: '#161513',
    cream: '#F5F1E8',
    grey: '#C9C2B4',
    mustard: '#F0B429'
})

const TITLE_FONT = "Anton, Impact, 'Arial Narrow', sans-serif"
const TEXT_FONT = "'Inter Tight', Arial, sans-serif"

/* Escapa los caracteres especiales de HTML. El nombre y las notas los escribe el cliente:
sin esto, alguien podría meter etiquetas o enlaces en el correo */
const escapeHtml = value => String( value )
    .replace( /&/g, '&amp;' )
    .replace( /</g, '&lt;' )
    .replace( />/g, '&gt;' )
    .replace( /"/g, '&quot;' )
    .replace( /'/g, '&#39;' )

/* Escribe una fecha 'AAAA-MM-DD' entera en español: '2026-11-28' → 'sábado 28 de noviembre'.
Se lee en UTC para que la zona horaria del servidor no cambie el día.
Intl pone una coma después del día de la semana; montamos el texto con sus partes para quitarla */
const formatLongDate = date => {
    const parts = new Intl.DateTimeFormat( 'es-ES', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
        .formatToParts( new Date( `${ date }T00:00:00Z` ) )

    const part = type => parts.find( item => item.type === type ).value

    return `${ part( 'weekday' ) } ${ part( 'day' ) } de ${ part( 'month' ) }`
}

/* Una fila de datos de la reserva en el HTML: etiqueta en gris y valor en crema */
const detailRow = ( label, value ) => `
                <tr>
                    <td style="padding: 6px 0; font-family: ${ TEXT_FONT }; font-size: 14px; color: ${ COLORS.grey }; width: 90px; vertical-align: top;">${ label }</td>
                    <td style="padding: 6px 0; font-family: ${ TEXT_FONT }; font-size: 16px; color: ${ COLORS.cream }; font-weight: bold;">${ value }</td>
                </tr>`

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

    const subject = `${ title }: ${ longDate } a las ${ time }`

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
                            ${ title }
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 32px 16px; font-family: ${ TEXT_FONT }; font-size: 16px; color: ${ COLORS.cream };">
                            Hola, ${ escapeHtml( name ) }:
                        </td>
                    </tr>${ isUpdate ? `
                    <tr>
                        <td style="padding: 0 32px 16px; font-family: ${ TEXT_FONT }; font-size: 16px; color: ${ COLORS.cream };">
                            ${ updateIntro }
                        </td>
                    </tr>` : '' }
                    <tr>
                        <td style="padding: 0 32px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ detailRow( 'Día', escapeHtml( longDate ) ) }${ detailRow( 'Hora', escapeHtml( time ) ) }${ detailRow( 'Personas', escapeHtml( people ) ) }${ hasNotes ? detailRow( 'Notas', escapeHtml( notes ) ) : '' }
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 24px;">
                            <a href="${ escapeHtml( manageUrl ) }" style="display: inline-block; padding: 14px 24px; background-color: ${ COLORS.mustard }; color: #000000; font-family: ${ TEXT_FONT }; font-size: 16px; font-weight: bold; text-decoration: none;">Ver o cambiar mi reserva</a>
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
        `Si necesitas algo, llámanos al ${ RESTAURANT.phone }`,
        '',
        `${ RESTAURANT.name } · ${ RESTAURANT.address }`
    ].join( '\n' )

    return { subject, html, text }
}

/* Exportamos el correo para los controllers, formatLongDate para los tests y escapeHtml para reutilizarlo en otros correos */
module.exports = {
    buildConfirmationEmail,
    formatLongDate,
    escapeHtml
}
