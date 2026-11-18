
import { Button } from '@components/button/button.jsx'
import { Icon } from '@components/icon/icon.jsx'
import { CONTACT } from '@const/business.js'
import { ROUTES } from '@const/routes.js'
import './mobile-bar.css'

/* Barra fija abajo en el móvil con las dos acciones más importantes: llamar y reservar.
Solo se ve en pantallas pequeñas (lo decide el CSS) */
export const MobileBar = () => {

    return (
        <div className="MobileBar">
            {/* El botón de llamar solo tiene icono: aria-label le pone nombre para los lectores de pantalla */}
            <a href={CONTACT.phoneHref} className="MobileBar-call" aria-label={`Llamar al mesón: ${ CONTACT.phone }`} title="Llamar al mesón">
                <Icon name="phone" />
            </a>
            {/* De momento lleva a la portada: cambiará a la página de reservas cuando la creemos */}
            <div className="MobileBar-reserve">
                <Button href={ROUTES.HOME} title="Ir a reservar mesa">Reservar mesa</Button>
            </div>
        </div>
    )
}
