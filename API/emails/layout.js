
/* Diseño común de los correos del mesón y las piezas que se repiten en ellos.
Cada correo (confirmación, cancelación…) solo dice qué piezas lleva y en qué orden;
aquí está cómo se pinta cada una. El HTML usa tablas porque es lo que mejor respetan
los programas de correo, y los estilos vienen de styles.js */
const { STYLES } = require( './styles' )
const { escapeHtml } = require( './format' )

/* Datos del mesón que salen en los correos */
const RESTAURANT = Object.freeze({
    name: 'Mesón La Paloma',
    address: 'C/ Artajona, 9 · 28039 Madrid',
    phone: '608 83 65 64',
    phoneHref: 'tel:+34608836564'
})

/* Atributos de las tablas de maquetación: role="presentation" avisa a los lectores de pantalla
de que no son tablas de datos, y el resto quita los huecos que algunos programas añaden */
const TABLE = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"'

/* Una fila de la caja con un texto dentro. El texto llega ya preparado como HTML:
si lleva algo que escribe el cliente, quien llama tiene que escaparlo antes */
const paragraph = ( style, html ) => `
                    <tr>
                        <td style="${ style }">
                            ${ html }
                        </td>
                    </tr>`

/* Título grande del correo: "Reserva confirmada", "Reserva cancelada"… */
const heading = text => paragraph( STYLES.title, text )

/* Una fila de datos de la reserva: etiqueta en gris y valor en crema.
El valor se escapa aquí, porque puede venir del cliente (las notas, por ejemplo) */
const detailRow = ( label, value ) => `
                                <tr>
                                    <td style="${ STYLES.detailLabel }">${ label }</td>
                                    <td style="${ STYLES.detailValue }">${ escapeHtml( value ) }</td>
                                </tr>`

/* El bloque con los datos de la reserva: una tabla con las filas que le pasemos (hechas con detailRow) */
const details = rows => `
                    <tr>
                        <td style="${ STYLES.section }">
                            <table ${ TABLE }>${ rows.join( '' ) }
                            </table>
                        </td>
                    </tr>`

/* Enlace con forma de botón. El enlace se escapa porque lleva datos de la reserva */
const button = ( href, label ) => `
                    <tr>
                        <td style="${ STYLES.section }">
                            <a href="${ escapeHtml( href ) }" style="${ STYLES.button }">${ label }</a>
                        </td>
                    </tr>`

/* Línea final de la caja con el teléfono del mesón, que se puede pulsar para llamar desde el móvil */
const helpLine = () => `
                    <tr>
                        <td style="${ STYLES.help }">
                            Si necesitas algo, llámanos al <a href="${ RESTAURANT.phoneHref }" style="${ STYLES.phone }">${ RESTAURANT.phone }</a>
                        </td>
                    </tr>`

/* Documento HTML completo de un correo.
- title: el texto de <title> (normalmente el asunto); se escapa aquí.
- content: lista de filas de la caja (hechas con las piezas de arriba). Las vacías ('') se saltan,
así un correo puede poner una pieza solo en algunos casos con `condición ? pieza : ''`.
Arriba de la caja va siempre "MESÓN LA PALOMA" y debajo, fuera de la caja, el pie con la dirección */
const emailLayout = ({ title, content }) => `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${ escapeHtml( title ) }</title>
</head>
<body style="${ STYLES.page }">
    <table ${ TABLE } style="${ STYLES.background }">
        <tr>
            <td align="center" style="${ STYLES.pageCell }">
                <table ${ TABLE } style="${ STYLES.box }">
                    <tr>
                        <td style="${ STYLES.brand }">
                            MESÓN <span style="${ STYLES.brandAccent }">LA PALOMA</span>
                        </td>
                    </tr>${ content.filter( Boolean ).join( '' ) }
                </table>
                <table ${ TABLE } style="${ STYLES.footerBox }">
                    <tr>
                        <td align="center" style="${ STYLES.footer }">
                            ${ RESTAURANT.name } · ${ RESTAURANT.address }
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

/* Exportamos el diseño, las piezas y los datos del mesón (que también usa el texto plano de cada correo) */
module.exports = {
    RESTAURANT,
    emailLayout,
    paragraph,
    heading,
    details,
    detailRow,
    button,
    helpLine
}
