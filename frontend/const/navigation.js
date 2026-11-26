
import { ROUTES } from '@const/routes.js'

/* Enlaces del menú principal. Los usan la cabecera de escritorio y el menú del móvil.
"Mi reserva" no está: esa página solo se abre con el enlace del correo de confirmación */
export const NAV_LINKS = Object.freeze([
    { text: 'Carta', href: ROUTES.FOOD_MENU, title: 'Ir a la carta' },
    { text: 'Experiencias', href: ROUTES.EXPERIENCES, title: 'Ir a las experiencias' },
    { text: 'Menús y eventos', href: ROUTES.EVENTS, title: 'Ir a los menús y eventos' },
    { text: 'Nosotros', href: ROUTES.ABOUT, title: 'Ir a la historia del mesón' }
])

/* Dice si un enlace del menú es el de la página en la que estamos.
La portada nunca se marca: su dirección es '/', con la que empiezan todas, y se marcaría siempre.
startsWith marca también las páginas que cuelguen de él (/carta/postres) */
export const isActiveLink = ( href, pathname ) => href !== ROUTES.HOME && pathname.startsWith( href )
