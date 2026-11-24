
/* La ruta /carta muestra la vista FoodMenu. Next pide que cada page.jsx tenga un export default,
así que reexportamos el componente con ese nombre */
export { FoodMenu as default } from '@views/food-menu/food-menu.jsx'

/* Título de la pestaña ("Carta · Mesón La Paloma", gracias al template del layout) y descripción para Google */
export const metadata = {
    title: 'Carta',
    description: 'La carta del Mesón La Paloma: desayunos, bocadillos, hamburguesas, platos combinados, platos especiales y raciones para compartir.'
}
