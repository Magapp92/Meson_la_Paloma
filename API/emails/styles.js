
/* Estilos de los correos del mesón.
Los correos llevan los estilos en línea (style="…" en cada etiqueta) porque Gmail y Outlook
ignoran casi todo el CSS de <style> y las clases: es la única forma de que se vean bien en todos.
Aquí se escriben aparte, cada uno con un nombre, para que el HTML de los correos se lea sin ruido:
en el HTML solo aparece style="${ STYLES.title }" y aquí se ve qué hay dentro */

/* Colores de la web, para que el correo se reconozca como del mesón */
const COLORS = Object.freeze({
    background: '#0E0E0D',
    box: '#161513',
    cream: '#F5F1E8',
    grey: '#C9C2B4',
    mustard: '#F0B429',
    black: '#000000'
})

/* Fuentes de la web, con alternativas por si el programa de correo no las tiene */
const FONTS = Object.freeze({
    title: "Anton, Impact, 'Arial Narrow', sans-serif",
    text: "'Inter Tight', Arial, sans-serif"
})

/* Cada estilo es una línea de CSS lista para poner dentro de style="…" */
const STYLES = Object.freeze({

    /* <body>: sin márgenes y con el fondo oscuro */
    page: `margin: 0; padding: 0; background-color: ${ COLORS.background };`,

    /* Tabla que ocupa todo el ancho y pinta el fondo (algunos programas ignoran el fondo del <body>) */
    background: `background-color: ${ COLORS.background };`,

    /* Celda que centra la caja y deja aire alrededor */
    pageCell: 'padding: 32px 16px;',

    /* Caja del contenido: ancho máximo y fondo algo más claro que la página */
    box: `max-width: 560px; background-color: ${ COLORS.box };`,

    /* Nombre del mesón arriba de la caja: "MESÓN LA PALOMA" */
    brand: `padding: 32px 32px 8px; font-family: ${ FONTS.title }; font-size: 22px; letter-spacing: 1px; text-transform: uppercase; color: ${ COLORS.cream };`,

    /* "LA PALOMA" en mostaza, dentro del nombre del mesón */
    brandAccent: `color: ${ COLORS.mustard };`,

    /* Título grande del correo: "Reserva confirmada", "Reserva cancelada"… */
    title: `padding: 16px 32px 8px; font-family: ${ FONTS.title }; font-size: 32px; line-height: 1.1; text-transform: uppercase; color: ${ COLORS.cream };`,

    /* Saludo "Hola, …:" cuando le siguen directamente los datos de la reserva */
    greeting: `padding: 8px 32px 16px; font-family: ${ FONTS.text }; font-size: 16px; color: ${ COLORS.cream };`,

    /* Saludo "Hola, …:" cuando le sigue una frase (deja menos espacio debajo) */
    greetingBeforeText: `padding: 8px 32px 8px; font-family: ${ FONTS.text }; font-size: 16px; color: ${ COLORS.cream };`,

    /* Frase normal del correo, en crema: "Hemos cancelado tu reserva:"… */
    text: `padding: 0 32px 16px; font-family: ${ FONTS.text }; font-size: 16px; color: ${ COLORS.cream };`,

    /* Celda que envuelve un bloque (los datos de la reserva o el botón) con espacio debajo */
    section: 'padding: 0 32px 24px;',

    /* Etiqueta de una fila de datos, en gris: "Día", "Hora"… */
    detailLabel: `padding: 6px 0; font-family: ${ FONTS.text }; font-size: 14px; color: ${ COLORS.grey }; width: 90px; vertical-align: top;`,

    /* Valor de una fila de datos, en crema y negrita */
    detailValue: `padding: 6px 0; font-family: ${ FONTS.text }; font-size: 16px; color: ${ COLORS.cream }; font-weight: bold;`,

    /* Enlace con forma de botón mostaza: "Ver o cambiar mi reserva", "Hacer otra reserva" */
    button: `display: inline-block; padding: 14px 24px; background-color: ${ COLORS.mustard }; color: ${ COLORS.black }; font-family: ${ FONTS.text }; font-size: 16px; font-weight: bold; text-decoration: none;`,

    /* Aviso pequeño en gris, como el del calendario */
    note: `padding: 0 32px 16px; font-family: ${ FONTS.text }; font-size: 14px; color: ${ COLORS.grey };`,

    /* Última línea de la caja: "Si necesitas algo, llámanos al …" (con más espacio debajo) */
    help: `padding: 0 32px 32px; font-family: ${ FONTS.text }; font-size: 14px; color: ${ COLORS.grey };`,

    /* Teléfono del mesón dentro de la línea de ayuda, en mostaza y sin subrayar */
    phone: `color: ${ COLORS.mustard }; text-decoration: none;`,

    /* Tabla del pie, fuera de la caja: mismo ancho máximo pero sin fondo */
    footerBox: 'max-width: 560px;',

    /* Pie con el nombre y la dirección del mesón, pequeño y en gris */
    footer: `padding: 16px 32px; font-family: ${ FONTS.text }; font-size: 12px; color: ${ COLORS.grey };`
})

/* Exportamos los estilos para el diseño común y los correos */
module.exports = {
    STYLES
}
