
/* Carga en MongoDB los datos fijos: la carta (colección menu) y las mesas (colección tables).
Vacía cada colección y la vuelve a llenar con los archivos de data/.
Se lanza a mano con npm run seed cada vez que cambia la carta o el aforo. No toca las reservas */
const mongoose = require( 'mongoose' )
const { connect } = require( './db' )
const { MenuCategory, Table } = require( './models' )
const { FOOD_MENU } = require( './data/food-menu' )
const { TABLES } = require( './data/tables' )

/* La carta: a cada categoría le añadimos su posición (order), empezando por 1 */
const seedMenu = async () => {
    const categories = FOOD_MENU.map( ( category, index ) => ({ ...category, order: index + 1 }) )

    /* Borramos lo que hubiera y guardamos la carta entera. insertMany valida cada categoría con el schema */
    await MenuCategory.deleteMany({})
    const saved = await MenuCategory.insertMany( categories )

    const dishes = saved.reduce( ( total, category ) => total + category.dishes.length, 0 )
    console.log( `Carta cargada: ${ saved.length } categorías y ${ dishes } platos` )
}

/* Las mesas */
const seedTables = async () => {
    await Table.deleteMany({})
    const saved = await Table.insertMany( TABLES )

    const seats = saved.reduce( ( total, table ) => total + table.seats, 0 )
    console.log( `Mesas cargadas: ${ saved.length } mesas y ${ seats } comensales` )
}

const seed = async () => {
    try {
        await connect()
        await seedMenu()
        await seedTables()
    } catch ( error ) {
        console.log( `No se pudieron cargar los datos: ${ error.message }` )
        process.exitCode = 1
    } finally {
        /* Cerramos la conexión para que el script termine */
        await mongoose.disconnect()
    }
}

seed()
