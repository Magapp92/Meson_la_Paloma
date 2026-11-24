
/* La ruta /menus-y-eventos muestra la vista Events */
export { Events as default } from '@views/events/events.jsx'

/* La página depende del mes (la tarjeta de Navidad solo sale en noviembre y diciembre):
Next la vuelve a generar como mucho cada hora (3600 segundos) para que el cambio de mes se note */
export const revalidate = 3600

/* Título de la pestaña ("Menús y eventos · Mesón La Paloma") y descripción para Google */
export const metadata = {
    title: 'Menús y eventos',
    description: 'Celebra en el Mesón La Paloma: cumpleaños, comidas de empresa, grupos y comidas y cenas de Navidad en Valdezarza, Madrid. Llámanos y pide tu presupuesto.'
}
