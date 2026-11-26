
/* Tests del script que carga la carta y las mesas. No tocan MongoDB: antes de cargar seed.js metemos en
require.cache unos modelos falsos que apuntan lo que se les pide, y una conexión falsa (así tampoco se lee el .env).
Cada archivo de test va en su propio proceso con node --test, así que el cambio no afecta a los demás */
const { test, beforeEach } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const path = require( 'node:path' )
const Module = require( 'node:module' )
const { FOOD_MENU } = require( './food-menu' )
const { TABLES } = require( './tables' )

/* Lo que se pide a cada modelo falso, en orden: [ método, argumentos ] */
const calls = { menu: [], tables: [] }

/* Un modelo falso: new Modelo( datos ).validate() no falla y los métodos solo se apuntan */
const fakeModel = log => {
    class FakeModel {
        async validate() {}
    }
    for ( const method of [ 'bulkWrite', 'deleteMany', 'updateMany', 'insertMany' ] ) {
        FakeModel[ method ] = async ( ...args ) => { log.push([ method, ...args ]) }
    }

    return FakeModel
}

const setCachedModule = ( relativePath, exports ) => {
    const filename = require.resolve( path.join( __dirname, '..', relativePath ) )
    const fakeModule = new Module( filename )
    fakeModule.filename = filename
    fakeModule.loaded = true
    fakeModule.exports = exports
    require.cache[ filename ] = fakeModule
}

setCachedModule( 'models/index.js', { MenuCategory: fakeModel( calls.menu ), Table: fakeModel( calls.tables ), Reservation: {} } )
setCachedModule( 'config/db.js', { connect: async () => { throw new Error( 'El test no debería conectarse' ) } } )

const { seedMenu, seedTables } = require( './seed' )

beforeEach( t => {
    calls.menu.length = 0
    calls.tables.length = 0
    t.mock.method( console, 'log', () => {} )
})

test( 'las mesas se guardan por número con upsert y no se borra ninguna', async () => {
    await seedTables()

    const methods = calls.tables.map( ([ method ]) => method )
    assert.deepEqual( methods, [ 'bulkWrite', 'updateMany' ] )

    const [ , operations ] = calls.tables[ 0 ]
    assert.equal( operations.length, TABLES.length )
    assert.deepEqual( operations[ 0 ], {
        updateOne: {
            filter: { number: TABLES[ 0 ].number },
            update: { $set: { seats: TABLES[ 0 ].seats, active: true } },
            upsert: true
        }
    })
})

test( 'las mesas que ya no están en tables.js se marcan active: false', async () => {
    await seedTables()

    const [ , filter, update ] = calls.tables[ 1 ]
    assert.deepEqual( filter, { number: { $nin: TABLES.map( table => table.number ) } } )
    assert.deepEqual( update, { $set: { active: false } } )
})

test( 'la carta se guarda por slug con upsert, con su posición, y se borran las categorías que sobran', async () => {
    await seedMenu()

    const methods = calls.menu.map( ([ method ]) => method )
    assert.deepEqual( methods, [ 'bulkWrite', 'deleteMany' ] )

    const [ , operations ] = calls.menu[ 0 ]
    assert.equal( operations.length, FOOD_MENU.length )
    operations.forEach( ( operation, index ) => {
        assert.deepEqual( operation.updateOne.filter, { slug: FOOD_MENU[ index ].slug } )
        assert.equal( operation.updateOne.update.$set.order, index + 1 )
        assert.equal( operation.updateOne.upsert, true )
    })

    const [ , filter ] = calls.menu[ 1 ]
    assert.deepEqual( filter, { slug: { $nin: FOOD_MENU.map( category => category.slug ) } } )
})

/* Si una categoría ya no lleva nota o columnas de precio, se quitan de la base en vez de quedarse las de antes */
test( 'la carta quita de la base los campos opcionales que la categoría ya no tiene', async () => {
    await seedMenu()

    const [ , operations ] = calls.menu[ 0 ]
    operations.forEach( ( { updateOne: { update } }, index ) => {
        const category = FOOD_MENU[ index ]
        for ( const field of [ 'priceLabels', 'note' ] ) {
            if ( category[ field ] === undefined ) assert.equal( update.$unset[ field ], '' )
            else assert.ok( !update.$unset || !( field in update.$unset ) )
        }
    })
})
