/* Tests de la comprobación de la configuración al arrancar (config/env.js).
loadConfig recibe un objeto de variables inventado en vez de process.env: así no dependemos del .env */
const { test, describe } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const path = require( 'node:path' )
const { spawnSync } = require( 'node:child_process' )
const { loadConfig } = require( './env' )

/* Todas las variables necesarias, con valores inventados */
const completeEnv = () => ({
    MONGO_URI: 'mongodb+srv://usuario:clave-inventada@cluster.ejemplo.mongodb.net/meson',
    BREVO_API_KEY: 'clave-inventada',
    MAIL_FROM: 'meson@ejemplo.es',
    SITE_URL: 'http://localhost:3000'
})

/* Guarda lo que se escribe con console.warn mientras corre fn */
const captureWarnings = fn => {
    const warnings = []
    const original = console.warn
    console.warn = ( ...args ) => warnings.push( args.join( ' ' ) )

    try {
        return { result: fn(), warnings }
    } finally {
        console.warn = original
    }
}

describe( 'loadConfig', () => {
    test( 'con todo configurado no avisa ni falla', () => {
        const { result, warnings } = captureWarnings( () => loadConfig({ ...completeEnv(), NODE_ENV: 'production' }) )

        assert.deepEqual( result, [] )
        assert.equal( warnings.length, 0 )
    })

    test( 'en producción lanza un error que nombra las que faltan, sin enseñar los valores', () => {
        const env = { ...completeEnv(), NODE_ENV: 'production', BREVO_API_KEY: '', SITE_URL: undefined }

        assert.throws( () => loadConfig( env ), error => {
            assert.match( error.message, /BREVO_API_KEY/ )
            assert.match( error.message, /SITE_URL/ )
            assert.doesNotMatch( error.message, /MONGO_URI|MAIL_FROM/ )
            assert.ok( !error.message.includes( 'clave-inventada' ) )
            return true
        })
    })

    test( 'en desarrollo solo avisa por consola y devuelve las que faltan', () => {
        const env = { ...completeEnv(), NODE_ENV: 'development', BREVO_API_KEY: '   ' }
        const { result, warnings } = captureWarnings( () => loadConfig( env ) )

        assert.deepEqual( result, [ 'BREVO_API_KEY' ] )
        assert.equal( warnings.length, 1 )
        assert.match( warnings[ 0 ], /BREVO_API_KEY/ )
    })

    test( 'sin NODE_ENV se comporta como en desarrollo', () => {
        const env = { ...completeEnv(), MONGO_URI: '' }
        const { result } = captureWarnings( () => loadConfig( env ) )

        assert.deepEqual( result, [ 'MONGO_URI' ] )
    })

    /* El arranque de verdad (index.js) en producción: con las variables vacías (dotenv no pisa las que ya existen)
    el proceso termina con código 1 antes de conectar o abrir el puerto, y dice cuáles faltan */
    test( 'index.js en producción se para si falta alguna variable', () => {
        const result = spawnSync( process.execPath, [ path.join( __dirname, '..', 'index.js' ) ], {
            env: { ...process.env, NODE_ENV: 'production', MONGO_URI: '', BREVO_API_KEY: '', MAIL_FROM: '', SITE_URL: '', PORT: '0' },
            encoding: 'utf8',
            timeout: 10000
        })

        assert.equal( result.status, 1 )
        assert.match( result.stderr, /MONGO_URI, BREVO_API_KEY, MAIL_FROM, SITE_URL/ )
        assert.doesNotMatch( result.stdout, /API en http/ )
    })

    test( 'quita la barra final de SITE_URL', () => {
        const env = { ...completeEnv(), SITE_URL: 'https://mesonlapaloma.com//' }
        loadConfig( env )

        assert.equal( env.SITE_URL, 'https://mesonlapaloma.com' )
    })
})
