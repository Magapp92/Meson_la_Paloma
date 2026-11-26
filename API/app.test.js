/* Tests de la app de Express (app.js) y del manejo de errores (middlewares/errors.js).
La app se abre en un puerto libre de localhost (listen( 0 )) y se le hacen peticiones con fetch.
No usamos MongoDB: antes de cargar app.js metemos en require.cache un config/db.js falso
(como hace test-helpers/fake-db.js), con connect e isConnected que cada test puede cambiar */
const { test, describe, before, after, beforeEach } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const path = require( 'node:path' )
const Module = require( 'node:module' )

process.env.SITE_URL = 'http://localhost:3000'

/* La base falsa: por defecto conecta bien y la conexión está abierta */
const fakeDb = {
    connectError: null,
    connected: true
}

const dbFilename = require.resolve( path.join( __dirname, 'config', 'db.js' ) )
const dbModule = new Module( dbFilename )
dbModule.filename = dbFilename
dbModule.loaded = true
dbModule.exports = {
    connect: async () => {
        if ( fakeDb.connectError ) throw fakeDb.connectError
    },
    isConnected: () => fakeDb.connected
}
require.cache[ dbFilename ] = dbModule

const { app } = require( './app' )
const { errorHandler, SERVICE_UNAVAILABLE_MESSAGE } = require( './middlewares/errors' )

let server
let baseUrl

/* Los avisos de consola de la app (sin conexión, error inesperado) no ensucian la salida de los tests */
const silence = () => {
    const original = { log: console.log, error: console.error }
    console.log = () => {}
    console.error = () => {}

    return () => Object.assign( console, original )
}

before( async () => {
    await new Promise( resolve => {
        server = app.listen( 0, '127.0.0.1', resolve )
    })
    baseUrl = `http://127.0.0.1:${ server.address().port }`
})

after( () => new Promise( resolve => server.close( resolve ) ) )

beforeEach( () => {
    fakeDb.connectError = null
    fakeDb.connected = true
})

const request = async ( url, options ) => {
    const restore = silence()
    try {
        const response = await fetch( `${ baseUrl }${ url }`, options )
        const body = await response.json()

        return { response, body }
    } finally {
        restore()
    }
}

const postJson = ( url, body, contentType = 'application/json' ) => request( url, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body
})

/* Respuesta falsa de Express para llamar a errorHandler directamente */
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

describe( 'Sin conexión con MongoDB', () => {
    test( 'responde 503 si conectar falla', async () => {
        fakeDb.connectError = new Error( 'querySrv ENOTFOUND cluster.interno' )
        const { response, body } = await request( '/api/menu' )

        assert.equal( response.status, 503 )
        assert.deepEqual( body, { message: SERVICE_UNAVAILABLE_MESSAGE, data: null } )
    })

    test( 'responde 503 si la conexión se perdió después de arrancar (readyState distinto de 1)', async () => {
        fakeDb.connected = false
        const { response, body } = await request( '/api/menu' )

        assert.equal( response.status, 503 )
        assert.deepEqual( body, { message: SERVICE_UNAVAILABLE_MESSAGE, data: null } )
    })

    test( '/api y /api/days no dependen de la base de datos', async () => {
        fakeDb.connectError = new Error( 'Sin conexión' )
        fakeDb.connected = false

        assert.equal( ( await request( '/api' ) ).response.status, 200 )
        assert.equal( ( await request( '/api/days' ) ).response.status, 200 )
    })

    test( 'errorHandler convierte en 503 los errores de conexión de Mongo', () => {
        const errors = [ 'MongoServerSelectionError', 'MongoNetworkError', 'MongooseServerSelectionError' ].map( name => {
            const error = new Error( 'connect ECONNREFUSED 10.0.0.1:27017' )
            error.name = name
            return error
        })
        errors.push( new Error( 'Operation `reservations.find()` buffering timed out after 10000ms' ) )

        const restore = silence()
        try {
            for ( const error of errors ) {
                const res = createRes()
                errorHandler( error, { method: 'GET', path: '/api/menu' }, res, () => {} )

                assert.equal( res.statusCode, 503, error.name )
                assert.deepEqual( res.body, { message: SERVICE_UNAVAILABLE_MESSAGE, data: null } )
            }
        } finally {
            restore()
        }
    })
})

describe( 'Errores de la petición', () => {
    test( '400 con un JSON mal escrito', async () => {
        const { response, body } = await postJson( '/api/reservations', '{ "name": ' )

        assert.equal( response.status, 400 )
        assert.deepEqual( body, { message: 'Los datos enviados no son un JSON válido', data: null } )
    })

    test( '413 con un body de más de 10 kb', async () => {
        const { response, body } = await postJson( '/api/reservations', JSON.stringify({ notes: 'a'.repeat( 11 * 1024 ) }) )

        assert.equal( response.status, 413 )
        assert.deepEqual( body, { message: 'Los datos enviados son demasiado grandes', data: null } )
    })

    test( '415 con un charset no admitido, con un mensaje fijo que no repite lo recibido', async () => {
        const { response, body } = await postJson( '/api/reservations', '{}', 'application/json; charset=charset-inventado' )

        assert.equal( response.status, 415 )
        assert.deepEqual( body, { message: 'El formato de los datos enviados no es válido', data: null } )
        assert.ok( !JSON.stringify( body ).toLowerCase().includes( 'charset-inventado' ) )
    })

    test( '404 con el mensaje fijo, sin repetir la URL', async () => {
        const { response, body } = await request( '/api/no-existe-esta-ruta' )

        assert.equal( response.status, 404 )
        assert.deepEqual( body, { message: 'Esta dirección no existe en la API', data: null } )
    })

    test( '500 genérico sin enseñar el mensaje interno, y en la consola sin el body ni el código secreto', () => {
        const res = createRes()
        const logged = []
        const original = console.error
        console.error = ( ...args ) => logged.push( args )

        try {
            const error = new TypeError( 'No se puede leer la colección interna reservations_v2' )
            const req = { method: 'PATCH', path: '/api/reservations/codigo-secreto-123', body: { phone: '600000000' } }
            errorHandler( error, req, res, () => {} )
        } finally {
            console.error = original
        }

        assert.equal( res.statusCode, 500 )
        assert.deepEqual( res.body, { message: 'Ha habido un error en el servidor. Inténtalo de nuevo o llámanos', data: null } )

        const output = JSON.stringify( logged )
        assert.ok( output.includes( 'TypeError' ) )
        assert.ok( output.includes( 'PATCH' ) )
        assert.ok( !output.includes( '600000000' ) )
        assert.ok( !output.includes( 'codigo-secreto-123' ) )
    })
})

describe( 'Cabeceras', () => {
    test( 'X-Content-Type-Options: nosniff en todas las respuestas, también en los errores', async () => {
        assert.equal( ( await request( '/api' ) ).response.headers.get( 'x-content-type-options' ), 'nosniff' )
        assert.equal( ( await request( '/api/no-existe' ) ).response.headers.get( 'x-content-type-options' ), 'nosniff' )
    })

    test( 'Cache-Control: no-store en /api/reservations y sus subrutas, y no en la carta', async () => {
        fakeDb.connectError = new Error( 'Sin conexión' )

        assert.equal( ( await postJson( '/api/reservations', '{}' ) ).response.headers.get( 'cache-control' ), 'no-store' )
        assert.equal( ( await request( '/api/reservations/abc' ) ).response.headers.get( 'cache-control' ), 'no-store' )
        assert.equal( ( await request( '/api/reservations/abc/cancel', { method: 'PATCH' } ) ).response.headers.get( 'cache-control' ), 'no-store' )
        assert.notEqual( ( await request( '/api/days' ) ).response.headers.get( 'cache-control' ), 'no-store' )
    })

    test( 'CORS: permite la web de SITE_URL', async () => {
        const { response } = await request( '/api', { headers: { Origin: 'http://localhost:3000' } } )

        assert.equal( response.headers.get( 'access-control-allow-origin' ), 'http://localhost:3000' )
    })

    test( 'sin la cabecera X-Powered-By', async () => {
        assert.equal( ( await request( '/api' ) ).response.headers.get( 'x-powered-by' ), null )
    })
})
