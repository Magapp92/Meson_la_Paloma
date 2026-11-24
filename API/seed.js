
/* Carga la carta en MongoDB: vacía la colección menu y la vuelve a llenar con data/food-menu.js.
Se lanza a mano con npm run seed cada vez que cambia la carta */
const mongoose = require( 'mongoose' )
const { connect } = require( './db' )
const { MenuCategory } = require( './models' )
const { FOOD_MENU } = require( './data/food-menu' )

const seed = async () => {
    try {
        await connect()

        /* A cada categoría le añadimos su posición en la carta (order), empezando por 1 */
        const categories = FOOD_MENU.map( ( category, index ) => ({ ...category, order: index + 1 }) )

        /* Borramos lo que hubiera y guardamos la carta entera. insertMany valida cada categoría con el schema */
        await MenuCategory.deleteMany({})
        const saved = await MenuCategory.insertMany( categories )

        const dishes = saved.reduce( ( total, category ) => total + category.dishes.length, 0 )
        console.log( `Carta cargada: ${ saved.length } categorías y ${ dishes } platos` )
    } catch ( error ) {
        console.log( `No se pudo cargar la carta: ${ error.message }` )
        process.exitCode = 1
    } finally {
        /* Cerramos la conexión para que el script termine */
        await mongoose.disconnect()
    }
}

seed()
