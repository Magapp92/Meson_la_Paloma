
import { Anton, Inter_Tight } from 'next/font/google'
import { Header } from '@components/header/header.jsx'
import { Footer } from '@components/footer/footer.jsx'
import { MobileBar } from '@components/mobile-bar/mobile-bar.jsx'
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

/* Título de la pestaña y descripción para Google de toda la web.
El template completa el título de cada página: la carta pone "Carta" y se ve "Carta · Mesón La Paloma".
El default es el título de la portada, a la que no se le aplica el template */
export const metadata = {
    title: {
        template: '%s · Mesón La Paloma',
        default: 'Mesón La Paloma · Cocina americana y mediterránea en Madrid'
    },
    description: 'Mesón familiar en Valdezarza, Madrid, con más de 20 años de historia. Cocina americana y mediterránea, menús y noches temáticas.'
}

/* Layout raíz: Next lo pide obligatoriamente y envuelve todas las páginas.
Es el único sitio donde van las etiquetas <html> y <body>.
El Header y el Footer van aquí para que salgan en todas las páginas, encima y debajo de cada una,
y la barra del móvil, que se queda fija abajo */
const RootLayout = ({ children }) => {

    return (
        <html lang="es" className={`${ fontTitle.variable } ${ fontText.variable }`}>
            <body>
                <Header />
                {children}
                <Footer />
                <MobileBar />
            </body>
        </html>
    )
}

export default RootLayout
