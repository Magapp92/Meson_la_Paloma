
import { Anton, Inter_Tight } from 'next/font/google'
import './reset.css'

/* Next descarga las fuentes al compilar y las sirve desde nuestra web,
así el navegador no tiene que pedírselas a Google.
Cada una queda guardada en una variable CSS para usarla desde reset.css */
const fontTitle = Anton({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-title'
})

const fontText = Inter_Tight({
    subsets: ['latin'],
    variable: '--font-text'
})

/* Layout raíz: Next lo pide obligatoriamente y envuelve todas las páginas.
Es el único sitio donde van las etiquetas <html> y <body> */
const RootLayout = ({ children }) => {

    return (
        <html lang="es" className={`${ fontTitle.variable } ${ fontText.variable }`}>
            <body>{children}</body>
        </html>
    )
}

export default RootLayout
