
import Link from 'next/link'
import Image from 'next/image'
import { TodayHours } from '@components/today-hours/today-hours.jsx'
import { MobileMenu } from '@components/mobile-menu/mobile-menu.jsx'
import { NAV_LINKS } from '@const/navigation.js'
import { ROUTES } from '@const/routes.js'
import './header.css'

/* Cabecera de todas las páginas con la franja del horario, el logo y el menú.
El botón de reservar no va aquí: está en el hero de la portada, junto a Ver la carta */
export const Header = () => {

    return (
        <header className="Header">
            <TodayHours />
            <div className="Container Header-inner">
                {/* En el logo agrupamos el barril y el nombre del mesón; siempre lleva a la portada.
                La imagen lleva alt vacío porque el nombre ya está escrito al lado.
                width y height son el tamaño en pantalla: Next genera una versión de ese tamaño
                y otra del doble para las pantallas de alta densidad.
                El nombre va en dos líneas, como el título de la portada, pero todo en crema */}
                <Link href={ROUTES.HOME} className="Header-logo" title="Ir a la página de inicio">
                    <Image className="Header-logoImg" src="/img/logo-meson.webp" alt="" width={56} height={56} loading="eager" />
                    <span className="Header-logoText">
                        Mesón{' '}
                        <span className="Header-logoTextLine">La Paloma</span>
                    </span>
                </Link>
                {/* En el nav agrupamos los enlaces a cada página */}
                <nav className="Header-nav" aria-label="Principal">
                    { NAV_LINKS.map( link =>
                        <Link key={link.text} href={link.href} className="Header-link" title={link.title}>{link.text}</Link>
                    )}
                </nav>
                {/* El menú del móvil solo se ve en pantallas pequeñas, en lugar del nav */}
                <MobileMenu />
            </div>
        </header>
    )
}
