
import Link from 'next/link'
import { PARTY_SIZES } from '@const/booking.js'
import { ROUTES } from '@const/routes.js'
import './party-sizes.css'

/* Círculos con el número de personas para empezar una reserva. Los usan la portada y la franja de reserva.
Llevan a /reservar?personas=4: el formulario se abre con ese número ya elegido.
onAccent cambia los colores para ponerlos sobre un fondo mostaza */
export const PartySizes = ({ onAccent = false }) => {

    return (
        <ul className={`PartySizes ${ onAccent ? 'PartySizes--onAccent' : '' }`}>
            { PARTY_SIZES.map( size =>
                <li key={size}>
                    <Link href={`${ ROUTES.BOOKING }?personas=${ size }`} className="PartySizes-link" title={`Reservar mesa para ${ size } personas`}>{size}</Link>
                </li>
            )}
        </ul>
    )
}
