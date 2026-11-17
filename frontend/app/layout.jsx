/* Layout raíz: Next lo pide obligatoriamente y envuelve todas las páginas.
Es el único sitio donde van las etiquetas <html> y <body> */
export default function RootLayout(props) {

    const { children } = props

    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    )
}
