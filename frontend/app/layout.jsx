
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
Solo lleva lo común a toda la web: fuentes, estilos globales y metadata.
La cabecera, el pie y la barra del móvil van en el layout de (site),
así las páginas privadas como Mi reserva pueden tener su propia interfaz */
const RootLayout = ({ children }) => {

    return (
        <html lang="es" className={`${ fontTitle.variable } ${ fontText.variable }`}>
            <body>
                {children}
            </body>
        </html>
    )
}

export default RootLayout
