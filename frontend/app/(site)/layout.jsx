
import { Header } from '@components/header/header.jsx'
import { Footer } from '@components/footer/footer.jsx'
import { MobileBar } from '@components/mobile-bar/mobile-bar.jsx'

/* Layout de la web pública: envuelve todas las páginas de la carpeta (site).
Los paréntesis hacen que la carpeta no forme parte de la dirección: /carta sigue siendo /carta.
El Header y el Footer van aquí para que salgan en todas estas páginas, encima y debajo de cada una,
y la barra del móvil, que se queda fija abajo */
const SiteLayout = ({ children }) => {

    return (
        <>
            <Header />
            {children}
            <Footer />
            <MobileBar />
        </>
    )
}

export default SiteLayout
