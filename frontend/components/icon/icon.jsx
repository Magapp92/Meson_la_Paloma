
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
