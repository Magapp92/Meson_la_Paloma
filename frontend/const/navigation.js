
import { ROUTES } from '@const/routes.js'

/* Enlaces del menú principal. Los usan la cabecera de escritorio y el menú del móvil.
Los que aún no tienen página llevan a la portada: cambiarán a su ruta cuando la creemos */
export const NAV_LINKS = Object.freeze([
    { text: 'Carta', href: ROUTES.FOOD_MENU, title: 'Ir a la carta' },
    { text: 'Experiencias', href: ROUTES.HOME, title: 'Ir a las experiencias' },
    { text: 'Menús y eventos', href: ROUTES.HOME, title: 'Ir a los menús y eventos' },
    { text: 'Nosotros', href: ROUTES.HOME, title: 'Ir a la historia del mesón' },
    { text: 'Mi reserva', href: ROUTES.HOME, title: 'Ir a gestionar mi reserva' }
])

/* Dice si un enlace del menú es el de la página en la que estamos.
La portada nunca se marca: es a la que llevan provisionalmente los enlaces sin página,
y se marcarían todos a la vez. startsWith marca también las páginas que cuelguen de él (/carta/postres) */
export const isActiveLink = ( href, pathname ) => href !== ROUTES.HOME && pathname.startsWith( href )
