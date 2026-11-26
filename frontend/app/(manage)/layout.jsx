
import Link from 'next/link'
import Image from 'next/image'
import { CONTACT } from '@const/business.js'
import { ROUTES } from '@const/routes.js'
import './manage-layout.css'

/* Layout de las páginas privadas de cada cliente (como "Mi reserva"), a las que se llega desde un correo.
Es una interfaz aparte y sencilla: solo el logo arriba y una línea con la dirección y el teléfono abajo.
Sin menú, sin pie y sin barra del móvil, para que nada distraiga de la reserva.
Las etiquetas <html> y <body>, las fuentes y el CSS global los pone el layout raíz */
const ManageLayout = ({ children }) => {

    return (
        <div className="ManageLayout">
            {/* En la cabecera agrupamos el logo del mesón, a la izquierda como en la cabecera de la web; lleva a la portada.
            Container lo alinea con el contenido de la página.
            La imagen lleva alt vacío porque el nombre ya está escrito al lado. El nombre va en dos líneas */}
            <header className="ManageLayout-header">
                <div className="Container">
                    <Link href={ROUTES.HOME} className="ManageLayout-logo" title="Ir a la página de inicio">
                        <Image className="ManageLayout-logoImg" src="/img/logo-meson.webp" alt="" width={56} height={56} loading="eager" />
                        <span className="ManageLayout-logoText">
                            Mesón{' '}
                            <span className="ManageLayout-logoTextLine">La Paloma</span>
                        </span>
                    </Link>
                </div>
            </header>
            {/* En el main va la página privada */}
            <main className="ManageLayout-main">
                {children}
            </main>
            {/* En el pie agrupamos en una línea la dirección y el teléfono, por si hay que llamar o venir */}
            <footer className="ManageLayout-footer">
                <p className="ManageLayout-contact">
                    {`${ CONTACT.street }, ${ CONTACT.city }`} ·{' '}
                    <a href={CONTACT.phoneHref} className="ManageLayout-phone" title="Llamar al mesón">{CONTACT.phone}</a>
                </p>
            </footer>
        </div>
    )
}

export default ManageLayout
