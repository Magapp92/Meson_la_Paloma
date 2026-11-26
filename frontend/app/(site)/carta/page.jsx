
/* La ruta /carta muestra la vista FoodMenu. Next pide que cada page.jsx tenga un export default,
así que reexportamos el componente con ese nombre */
export { FoodMenu as default } from '@views/food-menu/food-menu.jsx'

/* La carta llega de la API: Next regenera la página como mucho cada hora (3600 segundos)
para que un cambio en la base de datos se vea sin volver a publicar la web */
export const revalidate = 3600

/* Título de la pestaña ("Carta · Mesón La Paloma", gracias al template del layout) y descripción para Google */
export const metadata = {
    title: 'Carta',
    description: 'La carta del Mesón La Paloma: desayunos, bocadillos, hamburguesas, platos combinados, platos especiales y raciones para compartir.'
}
