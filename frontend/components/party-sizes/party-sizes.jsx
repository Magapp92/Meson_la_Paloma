
import Link from 'next/link'
import { PARTY_SIZES } from '@const/booking.js'
import { ROUTES } from '@const/routes.js'
import './party-sizes.css'

/* Círculos con el número de personas para empezar una reserva. Los usan la portada y Nosotros.
De momento llevan a la portada: cuando creemos las reservas, abrirán el formulario con ese número ya elegido.
onAccent cambia los colores para ponerlos sobre un fondo mostaza */
export const PartySizes = ({ onAccent = false }) => {

    return (
        <ul className={`PartySizes ${ onAccent ? 'PartySizes--onAccent' : '' }`}>
            { PARTY_SIZES.map( size =>
                <li key={size}>
                    <Link href={ROUTES.HOME} className="PartySizes-link" title={`Reservar mesa para ${ size } personas`}>{size}</Link>
                </li>
            )}
        </ul>
    )
}
