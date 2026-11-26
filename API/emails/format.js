
/* Funciones para preparar los datos que salen en los correos: escapar el texto del cliente
y escribir la fecha en español. No dependen del diseño, por eso viven aparte */

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

/* Exportamos las dos funciones para los correos y sus tests */
module.exports = {
    escapeHtml,
    formatLongDate
}
