/* Tests de los recordatorios (sendDueReminders). No usan MongoDB ni la red: test-helpers/fake-db.js pone
una base en memoria y un envío de correos que solo apunta las llamadas.
El "ahora" se pasa a la función como instante fijo, así que aquí usamos el madrid-time de verdad
(el falso de fake-db siempre devuelve la misma hora y no sirve para calcular "dentro de 24 horas").
En noviembre y diciembre Madrid va 1 hora por delante de la hora universal: 16:00Z son las 17:00 de Madrid */
const { test, describe, beforeEach } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const fake = require( '../test-helpers/fake-db' )

/* Los dobles tienen que estar en require.cache antes de cargar el servicio.
Después quitamos el madrid-time falso de require.cache: así reminders.js carga el archivo de verdad */
fake.install()
delete require.cache[ require.resolve( './madrid-time' ) ]
const { sendDueReminders } = require( './reminders' )

process.env.SITE_URL = 'http://localhost:3000'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/* "Ahora" fijo: miércoles 25 de noviembre de 2026 a las 17:00 de Madrid */
const NOW = new Date( '2026-11-25T16:00:00Z' )

/* Una reserva guardada en la base falsa. Por defecto, confirmada para dentro de 20 horas
(jueves 26 a las 13:00 de Madrid) y creada hace 3 días */
const storedReservation = ( overrides = {} ) => fake.insertReservation({
    date: '2026-11-26',
    time: '13:00',
    partySize: 4,
    name: 'Lucía Pérez',
    phone: '600123456',
    email: 'lucia@ejemplo.es',
    table: 1,
    token: 'A'.repeat( 32 ),
    expiresAt: new Date( '2026-11-26T23:00:00Z' ),
    createdAt: new Date( NOW.getTime() - 3 * DAY_MS ),
    ...overrides
})

/* La reserva tal como está guardada ahora mismo en la base falsa */
const stored = reservation => fake.store.reservations.find( item => item._id === reservation._id )

beforeEach( () => {
    fake.resetDb()
    fake.resetMailer()
})

describe( 'sendDueReminders', () => {

    test( 'envía el recordatorio a una reserva confirmada que empieza dentro de 20 horas y se hizo hace 3 días', async () => {
        const reservation = storedReservation()
        const updatedAt = stored( reservation ).updatedAt.getTime()

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 1, skipped: 0, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 1 )
        assert.match( fake.mailer.calls[ 0 ].subject, /^Te esperamos mañana/ )
        assert.equal( fake.mailer.calls[ 0 ].to.email, 'lucia@ejemplo.es' )
        assert.equal( stored( reservation ).reminderSent, true )
        /* Marcar el aviso no cambia updatedAt: sigue siendo cuándo la guardó el cliente */
        assert.equal( stored( reservation ).updatedAt.getTime(), updatedAt )
    })

    test( 'no toca una reserva que empieza dentro de 30 horas', async () => {
        const reservation = storedReservation({ time: '23:00' })

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 0, skipped: 0, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 0 )
        assert.equal( stored( reservation ).reminderSent, false )
    })

    test( 'no toca una reserva que ya ha empezado', async () => {
        const reservation = storedReservation({ date: '2026-11-25', time: '13:00' })

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 0, skipped: 0, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 0 )
        assert.equal( stored( reservation ).reminderSent, false )
    })

    test( 'no toca una reserva cancelada', async () => {
        const reservation = storedReservation({ status: 'cancelled' })

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 0, skipped: 0, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 0 )
        assert.equal( stored( reservation ).reminderSent, false )
    })

    test( 'no toca una reserva que ya tiene el recordatorio enviado', async () => {
        storedReservation({ reminderSent: true })

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 0, skipped: 0, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    test( 'no avisa a una reserva hecha hace 2 horas para dentro de 20 horas, pero la marca como avisada', async () => {
        const reservation = storedReservation({ createdAt: new Date( NOW.getTime() - 2 * HOUR_MS ) })

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 0, skipped: 1, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 0 )
        assert.equal( stored( reservation ).reminderSent, true )
    })

    test( 'no avisa a una reserva creada hace días pero modificada hace 2 horas para dentro de 20 horas', async () => {
        const reservation = storedReservation({ updatedAt: new Date( NOW.getTime() - 2 * HOUR_MS ) })

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 0, skipped: 1, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 0 )
        assert.equal( stored( reservation ).reminderSent, true )
    })

    test( 'si el envío falla, reminderSent vuelve a false y cuenta como fallo', async () => {
        const reservation = storedReservation()
        fake.mailer.shouldFail = true

        const result = await sendDueReminders( NOW )

        assert.deepEqual( result, { sent: 0, skipped: 0, failed: 1 } )
        assert.equal( fake.mailer.calls.length, 1 )
        assert.equal( stored( reservation ).reminderSent, false )

        /* En la siguiente ejecución se reintenta y, como updatedAt no ha cambiado, no se toma por una reserva de última hora */
        fake.mailer.shouldFail = false
        const retry = await sendDueReminders( new Date( NOW.getTime() + 15 * 60 * 1000 ) )

        assert.deepEqual( retry, { sent: 1, skipped: 0, failed: 0 } )
        assert.equal( stored( reservation ).reminderSent, true )
    })

    test( 'dos ejecuciones seguidas envían un solo correo', async () => {
        storedReservation()

        const first = await sendDueReminders( NOW )
        const second = await sendDueReminders( NOW )

        assert.deepEqual( first, { sent: 1, skipped: 0, failed: 0 } )
        assert.deepEqual( second, { sent: 0, skipped: 0, failed: 0 } )
        assert.equal( fake.mailer.calls.length, 1 )
    })

    test( 'dos ejecuciones a la vez envían un solo correo', async () => {
        storedReservation()

        const results = await Promise.all([ sendDueReminders( NOW ), sendDueReminders( NOW ) ])

        assert.equal( results[ 0 ].sent + results[ 1 ].sent, 1 )
        assert.equal( fake.mailer.calls.length, 1 )
    })

    test( 'cambio de día: a las 23:30 avisa de una reserva de mañana a las 13:00', async () => {
        const reservation = storedReservation()

        /* Miércoles 25 a las 23:30 de Madrid */
        const result = await sendDueReminders( new Date( '2026-11-25T22:30:00Z' ) )

        assert.deepEqual( result, { sent: 1, skipped: 0, failed: 0 } )
        assert.equal( stored( reservation ).reminderSent, true )
    })

    test( 'cambio de mes y de año: el 31 de diciembre avisa de una reserva del 1 de enero, y no de una del 2', async () => {
        const createdAt = new Date( '2026-12-20T12:00:00Z' )
        const newYear = storedReservation({ date: '2027-01-01', time: '13:00', createdAt })
        const later = storedReservation({ date: '2027-01-02', time: '13:00', token: 'B'.repeat( 32 ), createdAt })

        /* Jueves 31 de diciembre a las 23:30 de Madrid */
        const result = await sendDueReminders( new Date( '2026-12-31T22:30:00Z' ) )

        assert.deepEqual( result, { sent: 1, skipped: 0, failed: 0 } )
        assert.equal( stored( newYear ).reminderSent, true )
        assert.equal( stored( later ).reminderSent, false )
    })
})
