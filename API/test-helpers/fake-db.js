/* Dobles para los tests de los controllers: una base de datos en memoria, un envío de correos falso
y un "ahora" fijo. Así los tests no tocan MongoDB, ni la red, ni el reloj.
Este archivo NO acaba en .test.js a propósito: node --test solo ejecuta como test los archivos
*.test.js, y este es solo una ayuda que cargan los tests.

Cómo se usa: llamar a install() ANTES de cargar el controller. install() mete en require.cache
los módulos falsos con la ruta de los de verdad (models/index.js, services/mailer.js y services/madrid-time.js), y require
los devuelve a ellos en vez de leer los archivos. Cada archivo de test va en su propio proceso
con node --test, así que el cambio no afecta a los demás tests */
const path = require( 'node:path' )
const Module = require( 'node:module' )
const { TABLES } = require( '../data/tables' )

/* "Ahora" fijo en Madrid: miércoles 25 de noviembre de 2026 a las 10:00, como en availability.test.js */
const NOW = Object.freeze({ date: '2026-11-25', time: '10:00' })

/* ---------- Base de datos en memoria ---------- */

const store = {
    reservations: [],
    tables: []
}

/* Ganchos de un solo uso para simular otra petición que escribe "a la vez" */
const hooks = {
    afterCreate: null,
    afterUpdate: null
}

/* Los _id son textos de 24 cifras hexadecimales que van creciendo, como los ObjectId de Mongo */
let idCounter = 0
const newId = () => ( ++idCounter ).toString( 16 ).padStart( 24, '0' )

/* Copia profunda sencilla que conserva las fechas: lo que devuelve lean() no debe ser el objeto guardado */
const clone = value => {
    if ( value instanceof Date ) return new Date( value.getTime() )
    if ( Array.isArray( value ) ) return value.map( clone )
    if ( value && typeof value === 'object' ) {
        return Object.fromEntries( Object.entries( value ).map( ([ key, item ]) => [ key, clone( item ) ] ) )
    }

    return value
}

/* Compara dos valores como lo haría Mongo con los tipos que usamos (texto, número, booleano, fecha) */
const sameValue = ( a, b ) => {
    if ( a instanceof Date && b instanceof Date ) return a.getTime() === b.getTime()

    return String( a ) === String( b ) && typeof a === typeof b
}

/* ¿Cumple el documento el filtro? Admite igualdad, $ne y $lte, que son los que usan los controllers */
const matches = ( doc, filter = {} ) => Object.entries( filter ).every( ([ key, condition ]) => {
    const value = doc[ key ]

    if ( condition && typeof condition === 'object' && !( condition instanceof Date ) ) {
        return Object.entries( condition ).every( ([ operator, operand ]) => {
            if ( operator === '$ne' ) return !sameValue( value, operand )
            if ( operator === '$lte' ) return value <= operand
            throw new Error( `Operador no soportado por la base falsa: ${ operator }` )
        })
    }

    return sameValue( value, condition )
})

/* Proyección de inclusión ({ table: 1, time: 1 }): solo esos campos y el _id */
const project = ( doc, projection ) => {
    if ( !projection ) return clone( doc )

    const fields = Object.keys( projection ).filter( key => projection[ key ] )

    return clone( Object.fromEntries( [ '_id', ...fields ].filter( key => key in doc ).map( key => [ key, doc[ key ] ] ) ) )
}

/* Lo que devuelve find, findOne y findOneAndUpdate: se puede pedir .lean() o esperar directamente */
const query = run => ({
    lean: () => Promise.resolve().then( run ),
    then: ( resolve, reject ) => Promise.resolve().then( run ).then( resolve, reject )
})

/* Quita los campos undefined, como hace Mongoose al guardar (y así se aplican los valores por defecto) */
const withoutUndefined = data => Object.fromEntries( Object.entries( data ).filter( ([ , value ]) => value !== undefined ) )

const Table = {
    find: ( filter, projection ) => query( () => store.tables.filter( doc => matches( doc, filter ) ).map( doc => project( doc, projection ) ) )
}

const Reservation = {
    find: ( filter, projection ) => query( () => store.reservations.filter( doc => matches( doc, filter ) ).map( doc => project( doc, projection ) ) ),

    findOne: ( filter, projection ) => query( () => {
        const doc = store.reservations.find( item => matches( item, filter ) )

        return doc ? project( doc, projection ) : null
    }),

    /* Con los valores por defecto del schema (notes, status, reminderSent) y los timestamps */
    create: async data => {
        const doc = insertReservation( withoutUndefined( data ) )
        const created = clone( doc )

        if ( hooks.afterCreate ) {
            const hook = hooks.afterCreate
            hooks.afterCreate = null
            await hook( created )
        }

        return created
    },

    /* Solo cambios simples ({ campo: valor }), que es lo que mandan los controllers. Actualiza updatedAt */
    findOneAndUpdate: ( filter, update, options = {} ) => query( async () => {
        const doc = store.reservations.find( item => matches( item, filter ) )
        if ( !doc ) return null

        const before = clone( doc )
        Object.assign( doc, update, { updatedAt: nextDate( doc.updatedAt ) } )
        const result = clone( options.returnDocument === 'after' ? doc : before )

        if ( hooks.afterUpdate ) {
            const hook = hooks.afterUpdate
            hooks.afterUpdate = null
            await hook( clone( doc ) )
        }

        return result
    }),

    updateOne: async ( filter, update ) => {
        const doc = store.reservations.find( item => matches( item, filter ) )
        if ( !doc ) return { matchedCount: 0, modifiedCount: 0 }

        Object.assign( doc, update, { updatedAt: nextDate( doc.updatedAt ) } )

        return { matchedCount: 1, modifiedCount: 1 }
    },

    deleteOne: async filter => {
        const index = store.reservations.findIndex( item => matches( item, filter ) )
        if ( index === -1 ) return { deletedCount: 0 }

        store.reservations.splice( index, 1 )

        return { deletedCount: 1 }
    }
}

/* Una fecha nueva, siempre posterior a la anterior aunque caiga en el mismo milisegundo */
const nextDate = previous => {
    const now = Date.now()

    return new Date( previous && previous.getTime() >= now ? previous.getTime() + 1 : now )
}

/* Guarda una reserva directamente en la base falsa, con los valores por defecto del schema.
Sirve para preparar los casos de los tests; overrides puede traer createdAt para ordenar reservas */
const insertReservation = ( overrides = {} ) => {
    const createdAt = overrides.createdAt || new Date()
    const doc = {
        _id: newId(),
        notes: '',
        status: 'confirmed',
        reminderSent: false,
        ...overrides,
        createdAt,
        updatedAt: overrides.updatedAt || createdAt
    }
    store.reservations.push( doc )

    return doc
}

/* Lee una reserva tal como está guardada (copia), por su token */
const getReservationByToken = token => {
    const doc = store.reservations.find( item => item.token === token )

    return doc ? clone( doc ) : null
}

/* Deja la base como al principio: las mesas de data/tables.js, todas en uso, y ninguna reserva */
const resetDb = () => {
    store.reservations = []
    store.tables = TABLES.map( table => ({ _id: newId(), ...table, active: true }) )
    hooks.afterCreate = null
    hooks.afterUpdate = null
}

/* ---------- Envío de correos falso ---------- */

const mailer = {
    calls: [],
    shouldFail: false
}

/* Guarda cada correo que se "envía". Si shouldFail es true, lanza un error como si Brevo fallara */
const sendEmail = async email => {
    mailer.calls.push( email )
    if ( mailer.shouldFail ) throw new Error( 'Fallo simulado del envío de correos' )

    return { messageId: `fake-${ mailer.calls.length }` }
}

const resetMailer = () => {
    mailer.calls = []
    mailer.shouldFail = false
}

/* ---------- Reloj fijo ---------- */

const getMadridNow = () => ({ ...NOW })

/* ---------- Instalación en require.cache ---------- */

/* Registra exports como si fuera el módulo de esa ruta (relativa a la carpeta API) */
const setCachedModule = ( relativePath, exports ) => {
    const filename = require.resolve( path.join( __dirname, '..', relativePath ) )
    const fakeModule = new Module( filename )
    fakeModule.filename = filename
    fakeModule.loaded = true
    fakeModule.exports = exports
    require.cache[ filename ] = fakeModule
}

const install = () => {
    setCachedModule( 'models/index.js', { Table, Reservation, MenuCategory: {} } )
    setCachedModule( 'services/mailer.js', { sendEmail } )
    setCachedModule( 'services/madrid-time.js', { getMadridNow } )
    resetDb()
    resetMailer()
}

/* Respuesta falsa de Express: guarda el código y el JSON que envía el controller */
const createRes = () => {
    const res = {
        statusCode: null,
        body: null,
        status( code ) {
            res.statusCode = code
            return res
        },
        json( body ) {
            res.body = body
            return res
        }
    }

    return res
}

/* Llama a un handler con req y res falsos. Devuelve { res, error }: error es lo que le pase a next */
const callHandler = async ( handler, req = {} ) => {
    const res = createRes()
    let error = null
    await handler({ params: {}, query: {}, ...req }, res, nextError => { error = nextError })

    return { res, error }
}

module.exports = {
    NOW,
    install,
    resetDb,
    resetMailer,
    insertReservation,
    getReservationByToken,
    store,
    hooks,
    mailer,
    callHandler
}
