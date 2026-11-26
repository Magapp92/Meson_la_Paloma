
/* Carga en MongoDB los datos fijos: la carta (colección menu) y las mesas (colección tables).
Actualiza lo que ya hay con los archivos de data/ en vez de vaciar las colecciones y volver a llenarlas:
- Con la API en marcha no hay ningún momento sin mesas ni sin carta. Si se vaciara antes de volver a llenar,
  una reserva que llegara justo entonces no encontraría mesa, y la carta saldría vacía.
- Las mesas conservan su _id y las reservas que apuntan a una mesa no se quedan huérfanas.
Se lanza a mano con npm run seed cada vez que cambia la carta o el aforo. No toca las reservas */
const mongoose = require( 'mongoose' )
const { connect } = require( '../config/db' )
const { MenuCategory, Table } = require( '../models' )
const { FOOD_MENU } = require( './food-menu' )
const { TABLES } = require( './tables' )

/* Campos de una categoría que no todas tienen: si una categoría ya no los lleva en food-menu.js, se quitan de la base */
const OPTIONAL_MENU_FIELDS = [ 'priceLabels', 'note' ]

/* La carta: a cada categoría le añadimos su posición (order), empezando por 1.
Se guarda por slug: la que ya existe se actualiza y la nueva se crea (upsert). Las categorías que ya no están
en food-menu.js se borran: la carta no tiene nada que apunte a ella, así que se puede borrar sin problema */
const seedMenu = async () => {
    const categories = FOOD_MENU.map( ( category, index ) => ({ ...category, order: index + 1 }) )

    /* bulkWrite no valida con el schema: validamos antes cada categoría, como hacía insertMany */
    await Promise.all( categories.map( category => new MenuCategory( category ).validate() ) )

    await MenuCategory.bulkWrite( categories.map( category => {
        const missing = OPTIONAL_MENU_FIELDS.filter( field => category[ field ] === undefined )

        return {
            updateOne: {
                filter: { slug: category.slug },
                update: {
                    $set: category,
                    ...( missing.length && { $unset: Object.fromEntries( missing.map( field => [ field, '' ] ) ) } )
                },
                upsert: true
            }
        }
    }) )
    await MenuCategory.deleteMany({ slug: { $nin: categories.map( category => category.slug ) } })

    const dishes = categories.reduce( ( total, category ) => total + category.dishes.length, 0 )
    console.log( `Carta cargada: ${ categories.length } categorías y ${ dishes } platos` )
}

/* Las mesas: se guardan por número, la que ya existe se actualiza y la nueva se crea (upsert), y todas quedan en uso.
Las que ya no están en tables.js no se borran (puede haber reservas en ellas): se marcan active: false
y dejan de ofrecerse para reservas nuevas */
const seedTables = async () => {
    /* bulkWrite no valida con el schema: validamos antes cada mesa, como hacía insertMany */
    await Promise.all( TABLES.map( table => new Table( table ).validate() ) )

    await Table.bulkWrite( TABLES.map( table => ({
        updateOne: {
            filter: { number: table.number },
            update: { $set: { seats: table.seats, active: true } },
            upsert: true
        }
    })) )
    await Table.updateMany( { number: { $nin: TABLES.map( table => table.number ) } }, { $set: { active: false } } )

    const seats = TABLES.reduce( ( total, table ) => total + table.seats, 0 )
    console.log( `Mesas cargadas: ${ TABLES.length } mesas y ${ seats } comensales` )
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

/* Solo se carga al lanzarlo con npm run seed (node data/seed.js). Si lo carga otro archivo (seed.test.js),
no se conecta a nada: solo exporta las dos funciones */
if ( require.main === module ) seed()

module.exports = {
    seedMenu,
    seedTables
}
