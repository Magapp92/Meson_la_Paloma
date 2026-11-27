/* Tests del temporizador de los recordatorios. No esperan horas de verdad: mock.timers de node:test
controla el reloj y lo adelantamos a mano. La función que envía los avisos es falsa y solo cuenta las llamadas */
const { test, mock, afterEach } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const fake = require( '../test-helpers/fake-db' )

/* Los dobles de la base y del correo, por si acaso: el temporizador carga reminders.js, que usa los modelos */
fake.install()
const { startReminderTimer } = require( './reminder-timer' )

const HOUR_MS = 60 * 60 * 1000

/* Deja pasar las promesas pendientes (la ejecución falsa es asíncrona) */
const flush = () => new Promise( resolve => setImmediate( resolve ) )

let stop = null

afterEach( () => {
    stop?.()
    mock.timers.reset()
    mock.restoreAll()
})

test( 'busca al arrancar y después cada hora', async () => {
    mock.timers.enable({ apis: [ 'setInterval' ] })
    const run = mock.fn( async () => {} )

    stop = startReminderTimer({ run })
    await flush()
    assert.equal( run.mock.callCount(), 1 )

    mock.timers.tick( HOUR_MS - 1 )
    await flush()
    assert.equal( run.mock.callCount(), 1 )

    mock.timers.tick( 1 )
    await flush()
    assert.equal( run.mock.callCount(), 2 )

    mock.timers.tick( HOUR_MS )
    await flush()
    assert.equal( run.mock.callCount(), 3 )
})

test( 'si la ejecución anterior no ha terminado, no empieza otra encima', async () => {
    mock.timers.enable({ apis: [ 'setInterval' ] })
    let finish = null
    const run = mock.fn( () => new Promise( resolve => { finish = resolve } ) )

    stop = startReminderTimer({ run })
    mock.timers.tick( HOUR_MS )
    await flush()
    assert.equal( run.mock.callCount(), 1 )

    /* Termina la primera: la siguiente hora sí se ejecuta */
    finish()
    await flush()
    mock.timers.tick( HOUR_MS )
    await flush()
    assert.equal( run.mock.callCount(), 2 )
})

test( 'un fallo se apunta en la consola y no para el temporizador', async () => {
    mock.timers.enable({ apis: [ 'setInterval' ] })
    const consoleError = mock.method( console, 'error', () => {} )
    const run = mock.fn( async () => { throw new Error( 'Sin conexión' ) } )

    stop = startReminderTimer({ run })
    await flush()
    assert.equal( consoleError.mock.callCount(), 1 )
    assert.match( consoleError.mock.calls[ 0 ].arguments[ 1 ], /Sin conexión/ )

    mock.timers.tick( HOUR_MS )
    await flush()
    assert.equal( run.mock.callCount(), 2 )
})

test( 'la función que devuelve lo para', async () => {
    mock.timers.enable({ apis: [ 'setInterval' ] })
    const run = mock.fn( async () => {} )

    startReminderTimer({ run })()
    await flush()
    mock.timers.tick( 3 * HOUR_MS )
    await flush()
    assert.equal( run.mock.callCount(), 1 )
})
