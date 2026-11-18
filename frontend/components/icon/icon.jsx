
import './icon.css'

/* Dibujos de los iconos en SVG, hechos con trazos de línea en una cuadrícula de 24 x 24.
Toman el color del texto (currentColor), así cambian de color con el enlace que los contiene */
const ICONS = Object.freeze({
    instagram: (
        <>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r=".5" />
        </>
    ),
    facebook: (
        <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6v4h3v7h4v-7h3l1-4h-4V7.5a1 1 0 0 1 1-1h2z" />
    ),
    x: (
        <>
            <path d="M4 4l11.7 16H20L8.3 4z" />
            <path d="M4 20l6.8-7.8M20 4l-6.8 7.8" />
        </>
    ),
    phone: (
        <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z" />
    ),
    pin: (
        <>
            <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
            <circle cx="12" cy="10" r="2.5" />
        </>
    )
})

/* Icono por su nombre. Es decorativo (aria-hidden): quien lo usa pone el texto para lectores de pantalla */
export const Icon = ({ name }) => {

    return (
        <svg className="Icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[name]}
        </svg>
    )
}
