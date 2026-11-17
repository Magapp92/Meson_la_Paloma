
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@components/button/button.jsx'
import { TodayHours } from '@components/today-hours/today-hours.jsx'
import './header.css'

/* Enlaces del menú. De momento todos llevan a la portada:
cada uno se cambiará a su página cuando la creemos */
const NAV_LINKS = Object.freeze([
    { text: 'Carta', href: '/', title: 'Ir a la carta' },
    { text: 'Experiencias', href: '/', title: 'Ir a las experiencias' },
    { text: 'Menús y eventos', href: '/', title: 'Ir a los menús y eventos' },
    { text: 'Nosotros', href: '/', title: 'Ir a la historia del mesón' },
    { text: 'Mi reserva', href: '/', title: 'Ir a gestionar mi reserva' }
])

/* Cabecera de todas las páginas con la franja del horario, el logo, el menú y el botón de reservar */
export const Header = () => {

    return (
        <header className="Header">
            <TodayHours />
            <div className="Header-inner">
                {/* En el logo agrupamos el barril y el nombre del mesón; siempre lleva a la portada.
                La imagen lleva alt vacío porque el nombre ya está escrito al lado.
                width y height son el tamaño en pantalla: Next genera una versión de ese tamaño
                y otra del doble para las pantallas de alta densidad.
                El nombre va en dos líneas, como el título de la portada, pero todo en crema */}
                <Link href="/" className="Header-logo" title="Ir a la página de inicio">
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
                <div className="Header-cta">
                    <Button href="/" title="Ir a reservar mesa">Reservar mesa</Button>
                </div>
            </div>
        </header>
    )
}
