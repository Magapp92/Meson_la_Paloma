/* Tests de caracterización del controller de reservas: fijan cómo responde HOY cada endpoint
(crear, leer, modificar y cancelar), para que avisen si algo cambia al reorganizar el código.
No usan MongoDB, ni la red, ni el reloj: test-helpers/fake-db.js pone una base en memoria con las mesas
de data/tables.js, un envío de correos que solo apunta las llamadas y un "ahora" fijo:
miércoles 25 de noviembre de 2026 a las 10:00. El 30 es lunes y el 1 de diciembre martes */
const { test, describe, beforeEach } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const fake = require( '../test-helpers/fake-db' )

/* Los dobles tienen que estar en require.cache antes de cargar el controller */
fake.install()
const { postReservation, getReservation, updateReservation, cancelReservation, TOKEN_PATTERN } = require( './reservations' )

process.env.SITE_URL = 'http://localhost:3000'
process.env.MAIL_FROM = 'meson@ejemplo.es'
process.env.MAIL_FROM_NAME = 'Mesón La Paloma'

/* Tokens con la forma de los de la API (32 caracteres de [A-Za-z0-9_-]) */
const TOKEN_A = 'A'.repeat( 32 )
const TOKEN_B = 'B'.repeat( 32 )
const TOKEN_MISSING = 'Z'.repeat( 32 )

const NOT_FOUND = 'No encontramos ninguna reserva con este enlace'
const NOT_FREE = 'Esa hora ya no está libre. Elige otra, por favor'
const STARTED = 'Esta reserva ya ha empezado. Si necesitas algo, llámanos'

/* Datos correctos del formulario: martes 1 de diciembre a las 21:00, 4 personas */
const validBody = ( overrides = {} ) => ({
    date: '2026-12-01',
    time: '21:00',
    partySize: 4,
    name: 'Lucía Pérez',
    phone: '600 123 456',
    email: 'lucia@ejemplo.es',
    notes: 'Una trona',
    ...overrides
})

/* Una reserva ya guardada, con todos los campos, para los casos de leer, modificar y cancelar */
const storedReservation = ( overrides = {} ) => fake.insertReservation({
    date: '2026-12-01',
    time: '13:00',
    partySize: 4,
    name: 'Lucía Pérez',
    phone: '600123456',
    email: 'lucia@ejemplo.es',
    notes: 'Una trona',
    table: 1,
    token: TOKEN_A,
    ...overrides
})

/* Ocupa mesas a una hora del martes 1 de diciembre. Por defecto las tres de 6 (7, 8 y 9):
así para 5 o 6 personas no queda sitio cerca de esa hora */
const occupyTables = ( time, tables = [ 7, 8, 9 ], date = '2026-12-01' ) => {
    tables.forEach( ( table, index ) => fake.insertReservation({
        date, time, partySize: 6, name: 'Otra', phone: '600000000', email: 'otra@ejemplo.es',
        table, token: `${ index }`.repeat( 32 )
    }))
}

/* Valor de una línea del .ics adjunto: ( ics, 'METHOD' ) → 'REQUEST' */
const icsValue = ( ics, name ) => ics.split( '\r\n' ).find( line => line.startsWith( `${ name }:` ) )?.slice( name.length + 1 )

beforeEach( () => {
    fake.resetDb()
    fake.resetMailer()
})

describe( 'POST /api/reservations (postReservation)', () => {

    /* El caso bueno: responde 201 con los datos básicos y el token, guarda la reserva en la mesa más pequeña
    que vale (para 4 personas, la 1) y manda un correo de confirmación con la invitación de calendario */
    test( 'con datos correctos crea la reserva, elige mesa y manda el correo', async () => {
        const { res, error } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( error, null )
        assert.equal( res.statusCode, 201 )
        assert.equal( res.body.message, 'Reserva confirmada' )
        assert.deepEqual( Object.keys( res.body.data ).sort(), [ 'date', 'name', 'partySize', 'time', 'token' ] )
        assert.equal( res.body.data.date, '2026-12-01' )
        assert.equal( res.body.data.time, '21:00' )
        assert.equal( res.body.data.partySize, 4 )
        assert.equal( res.body.data.name, 'Lucía Pérez' )
        assert.match( res.body.data.token, TOKEN_PATTERN )

        assert.equal( fake.store.reservations.length, 1 )
        const saved = fake.getReservationByToken( res.body.data.token )
        assert.equal( saved.table, 1 )
        assert.equal( saved.status, 'confirmed' )
        assert.equal( saved.phone, '600 123 456' )
        assert.equal( saved.email, 'lucia@ejemplo.es' )
        assert.equal( saved.notes, 'Una trona' )

        assert.equal( fake.mailer.calls.length, 1 )
        const email = fake.mailer.calls[ 0 ]
        assert.deepEqual( email.to, { email: 'lucia@ejemplo.es', name: 'Lucía Pérez' } )
        assert.match( email.subject, /^Reserva confirmada/ )
        assert.ok( email.html.includes( `http://localhost:3000/mi-reserva?codigo=${ res.body.data.token }` ) )
        assert.equal( email.attachments.length, 1 )
        assert.equal( email.attachments[ 0 ].name, 'invite.ics' )
        assert.equal( icsValue( email.attachments[ 0 ].content, 'METHOD' ), 'REQUEST' )
        assert.equal( icsValue( email.attachments[ 0 ].content, 'SEQUENCE' ), '0' )
    })

    /* Para 2 personas la mesa más pequeña que vale es una de 2 (la 10) */
    test( 'para 2 personas elige la mesa de 2', async () => {
        const { res } = await fake.callHandler( postReservation, { body: validBody({ partySize: 2 }) } )

        assert.equal( res.statusCode, 201 )
        assert.equal( fake.getReservationByToken( res.body.data.token ).table, 10 )
    })

    /* status, table y token los pone la API: si llegan en el cuerpo se ignoran */
    test( 'ignora status, table y token si llegan en el cuerpo', async () => {
        const body = validBody({ status: 'cancelled', table: 99, token: TOKEN_B })
        const { res } = await fake.callHandler( postReservation, { body } )

        assert.equal( res.statusCode, 201 )
        assert.notEqual( res.body.data.token, TOKEN_B )
        const saved = fake.getReservationByToken( res.body.data.token )
        assert.equal( saved.status, 'confirmed' )
        assert.equal( saved.table, 1 )
        assert.equal( fake.getReservationByToken( TOKEN_B ), null )
    })

    /* Cada dato mal da 400 con su mensaje, y no se guarda nada ni se manda correo */
    const badCases = [
        [ 'correo mal escrito', validBody({ email: 'lucia-ejemplo.es' }), 'Escribe un correo válido' ],
        [ 'teléfono corto', validBody({ phone: '600 12' }), 'Escribe un teléfono válido' ],
        [ '8 personas', validBody({ partySize: 8 }), 'Se reserva para 2 a 6 personas. Para grupos más grandes, llámanos' ],
        [ 'fecha imposible', validBody({ date: '2026-13-01' }), 'La fecha no es válida: tiene que ser AAAA-MM-DD' ],
        [ 'lunes (cerrado)', validBody({ date: '2026-11-30' }), 'Ese día o a esa hora no se puede reservar. Elige una de las horas disponibles' ],
        [ 'hora suelta 21:10', validBody({ time: '21:10' }), 'Ese día o a esa hora no se puede reservar. Elige una de las horas disponibles' ],
        [ 'más allá de 30 días', validBody({ date: '2026-12-26' }), 'Se puede reservar desde hoy hasta dentro de 30 días' ],
        [ 'en el pasado', validBody({ date: '2026-11-24' }), 'Se puede reservar desde hoy hasta dentro de 30 días' ]
    ]

    badCases.forEach( ([ label, body, message ]) => {
        test( `responde 400 con ${ label }`, async () => {
            const { res } = await fake.callHandler( postReservation, { body } )

            assert.equal( res.statusCode, 400 )
            assert.deepEqual( res.body, { message, data: null } )
            assert.equal( fake.store.reservations.length, 0 )
            assert.equal( fake.mailer.calls.length, 0 )
        })
    })

    /* Sin cuerpo JSON Express 5 deja req.body en undefined: el controller lo trata como {} y responde 400 */
    test( 'sin cuerpo responde 400 con el primer error (la fecha)', async () => {
        const { res, error } = await fake.callHandler( postReservation, { body: undefined } )

        assert.equal( error, null )
        assert.equal( res.statusCode, 400 )
        assert.deepEqual( res.body, { message: 'La fecha no es válida: tiene que ser AAAA-MM-DD', data: null } )
    })

    /* Si las tres mesas de 6 están ocupadas a esa hora, para 6 personas no hay sitio: 409 */
    test( 'responde 409 si no queda mesa a esa hora', async () => {
        occupyTables( '21:00' )
        const { res } = await fake.callHandler( postReservation, { body: validBody({ partySize: 6 }) } )

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: NOT_FREE, data: null } )
        assert.equal( fake.store.reservations.length, 3 )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Si el envío del correo falla, la reserva se queda guardada y se responde 201 igual (el error solo va a la consola) */
    test( 'si falla el correo, responde 201 y la reserva queda guardada', async t => {
        const consoleError = t.mock.method( console, 'error', () => {} )
        fake.mailer.shouldFail = true

        const { res, error } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( error, null )
        assert.equal( res.statusCode, 201 )
        assert.equal( fake.store.reservations.length, 1 )
        assert.equal( fake.getReservationByToken( res.body.data.token ).status, 'confirmed' )
        assert.equal( fake.mailer.calls.length, 1 )
        assert.equal( consoleError.mock.callCount(), 1 )
    })

    /* Dos reservas a la vez en la misma mesa: justo después de guardar la nueva, otra petición guarda una
    reserva anterior (createdAt menor) en la mesa 1 a la misma hora. La comprobación posterior la detecta:
    la nueva se borra y responde 409. La que llegó antes se queda */
    test( 'si otra reserva anterior choca en la misma mesa, borra la nueva y responde 409', async () => {
        fake.hooks.afterCreate = created => {
            fake.insertReservation({
                date: created.date, time: created.time, partySize: 4, name: 'Otra', phone: '600000000',
                email: 'otra@ejemplo.es', table: created.table, token: TOKEN_B,
                createdAt: new Date( created.createdAt.getTime() - 1 )
            })
        }

        const { res } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: NOT_FREE, data: null } )
        assert.equal( fake.store.reservations.length, 1 )
        assert.equal( fake.store.reservations[ 0 ].token, TOKEN_B )
        assert.equal( fake.mailer.calls.length, 0 )
    })
})

describe( 'GET /api/reservations/:token (getReservation)', () => {

    /* Un código que no tiene la forma de los de la API da 404, sin consultar */
    test( 'con un token mal formado responde 404', async () => {
        storedReservation()
        const { res } = await fake.callHandler( getReservation, { params: { token: 'abc' } } )

        assert.equal( res.statusCode, 404 )
        assert.deepEqual( res.body, { message: NOT_FOUND, data: null } )
    })

    test( 'con un token que no existe responde 404', async () => {
        storedReservation()
        const { res } = await fake.callHandler( getReservation, { params: { token: TOKEN_MISSING } } )

        assert.equal( res.statusCode, 404 )
        assert.deepEqual( res.body, { message: NOT_FOUND, data: null } )
    })

    /* Solo los datos públicos: ni teléfono, ni correo, ni mesa, ni token, ni _id */
    test( 'con un token que existe responde 200 solo con los datos públicos', async () => {
        storedReservation()
        const { res } = await fake.callHandler( getReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'Tu reserva' )
        assert.deepEqual( res.body.data, {
            date: '2026-12-01',
            time: '13:00',
            partySize: 4,
            name: 'Lucía Pérez',
            notes: 'Una trona',
            status: 'confirmed',
            isPast: false
        })
    })

    /* Una reserva de un día anterior al "ahora" fijo sale como pasada */
    test( 'una reserva pasada sale con isPast: true', async () => {
        storedReservation({ date: '2026-11-20' })
        const { res } = await fake.callHandler( getReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.data.isPast, true )
    })

    /* El mismo día, a la hora exacta de ahora (10:00), ya cuenta como pasada (compara con <=) */
    test( 'una reserva de hoy a la hora de ahora ya cuenta como pasada', async () => {
        storedReservation({ date: '2026-11-25', time: '10:00' })
        const { res } = await fake.callHandler( getReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.body.data.isPast, true )
    })
})

describe( 'PATCH /api/reservations/:token (updateReservation)', () => {

    /* Los datos se comprueban antes que el token: con el cuerpo mal y un token que no existe, 400 y no 404 */
    test( 'con el cuerpo mal responde 400 antes de mirar el token', async () => {
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_MISSING },
            body: { date: '2026-12-01', time: '21:00', partySize: 8 }
        })

        assert.equal( res.statusCode, 400 )
        assert.deepEqual( res.body, { message: 'Se reserva para 2 a 6 personas. Para grupos más grandes, llámanos', data: null } )
    })

    /* Sin cuerpo también 400, aunque el token esté mal formado */
    test( 'sin cuerpo responde 400', async () => {
        const { res } = await fake.callHandler( updateReservation, { params: { token: 'abc' }, body: undefined } )

        assert.equal( res.statusCode, 400 )
        assert.equal( res.body.message, 'La fecha no es válida: tiene que ser AAAA-MM-DD' )
    })

    /* Fuera de plazo también va antes que el token */
    test( 'fuera de plazo responde 400', async () => {
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_MISSING },
            body: { date: '2026-12-26', time: '21:00', partySize: 4 }
        })

        assert.equal( res.statusCode, 400 )
        assert.equal( res.body.message, 'Se puede reservar desde hoy hasta dentro de 30 días' )
    })

    test( 'con datos bien y un token que no existe o mal formado responde 404', async () => {
        const body = { date: '2026-12-01', time: '21:00', partySize: 4 }

        for ( const token of [ TOKEN_MISSING, 'abc' ] ) {
            const { res } = await fake.callHandler( updateReservation, { params: { token }, body } )
            assert.equal( res.statusCode, 404 )
            assert.deepEqual( res.body, { message: NOT_FOUND, data: null } )
        }
    })

    test( 'una reserva cancelada no se modifica: 409', async () => {
        storedReservation({ status: 'cancelled' })
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 4 }
        })

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: 'Esta reserva está cancelada', data: null } )
    })

    /* Se mira la reserva tal como está: si ya empezó (hoy a las 09:00) no se cambia aunque la nueva hora sea futura */
    test( 'una reserva que ya ha empezado no se modifica: 409', async () => {
        storedReservation({ date: '2026-11-25', time: '09:00' })
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 4 }
        })

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: STARTED, data: null } )
    })

    /* Sin cambios: 200 con el mismo mensaje, pero sin guardar ni mandar correo */
    test( 'sin cambios responde 200 sin guardar ni mandar correo', async () => {
        const stored = storedReservation({ reminderSent: true })
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '13:00', partySize: 4 }
        })

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'Reserva modificada' )
        assert.equal( res.body.data.time, '13:00' )
        assert.equal( fake.mailer.calls.length, 0 )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.reminderSent, true )
        assert.equal( saved.updatedAt.getTime(), stored.updatedAt.getTime() )
    })

    /* Pasar a 6 personas a las 21:00 con las mesas de 6 ocupadas: 409 y la reserva sigue igual */
    test( 'a una hora sin mesa responde 409 y no cambia nada', async () => {
        storedReservation()
        occupyTables( '21:00' )
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 6 }
        })

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: NOT_FREE, data: null } )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.time, '13:00' )
        assert.equal( saved.partySize, 4 )
        assert.equal( saved.table, 1 )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* El cambio bueno: guarda día, hora, personas y la mesa nueva (para 2, la 10), pone reminderSent a false
    y manda el correo de "Reserva modificada" con la invitación con SEQUENCE mayor que 0 */
    test( 'con un cambio válido guarda la reserva y manda el correo de modificada', async () => {
        storedReservation({ reminderSent: true })
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-02', time: '20:00', partySize: 2, name: 'Otro nombre', status: 'cancelled', table: 99 }
        })

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'Reserva modificada' )
        assert.deepEqual( res.body.data, {
            date: '2026-12-02',
            time: '20:00',
            partySize: 2,
            name: 'Lucía Pérez',
            notes: 'Una trona',
            status: 'confirmed',
            isPast: false
        })

        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.date, '2026-12-02' )
        assert.equal( saved.time, '20:00' )
        assert.equal( saved.partySize, 2 )
        assert.equal( saved.table, 10 )
        assert.equal( saved.reminderSent, false )
        assert.equal( saved.status, 'confirmed' )
        assert.equal( saved.name, 'Lucía Pérez' )

        assert.equal( fake.mailer.calls.length, 1 )
        const email = fake.mailer.calls[ 0 ]
        assert.deepEqual( email.to, { email: 'lucia@ejemplo.es', name: 'Lucía Pérez' } )
        assert.match( email.subject, /^Reserva modificada/ )
        assert.equal( email.attachments[ 0 ].name, 'invite.ics' )
        const ics = email.attachments[ 0 ].content
        assert.equal( icsValue( ics, 'METHOD' ), 'REQUEST' )
        assert.ok( Number( icsValue( ics, 'SEQUENCE' ) ) > 0 )
        assert.equal( Number( icsValue( ics, 'SEQUENCE' ) ), Math.floor( saved.updatedAt.getTime() / 1000 ) )
    })

    /* La propia mesa no bloquea el cambio: la reserva está en la mesa 9 (de 6) para 4 personas a las 21:00
    y las otras mesas de 6 (7 y 8) están ocupadas a esa hora. Pasar a 5 personas a la misma hora solo es
    posible si no se cuenta a sí misma (exclude interno): responde 200 y se queda en la mesa 9 */
    test( 'su propia mesa no le bloquea al pasar de 4 a 5 personas a la misma hora', async () => {
        storedReservation({ time: '21:00', table: 9 })
        occupyTables( '21:00', [ 7, 8 ] )

        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 5 }
        })

        assert.equal( res.statusCode, 200 )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.partySize, 5 )
        assert.equal( saved.table, 9 )
        assert.equal( fake.mailer.calls.length, 1 )
    })

    /* Choque posterior: justo después de guardar el cambio (a las 21:00 en la mesa 10), otra petición guarda
    una reserva en la mesa 10 a las 21:00. La comprobación posterior lo detecta: responde 409 y la reserva
    vuelve a sus valores de antes (día, hora, personas, mesa y reminderSent) */
    test( 'si otra reserva choca después de guardar, deshace el cambio y responde 409', async () => {
        storedReservation({ reminderSent: true })
        fake.hooks.afterUpdate = updated => {
            fake.insertReservation({
                date: updated.date, time: updated.time, partySize: 2, name: 'Otra', phone: '600000000',
                email: 'otra@ejemplo.es', table: updated.table, token: TOKEN_B
            })
        }

        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 2 }
        })

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: NOT_FREE, data: null } )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.date, '2026-12-01' )
        assert.equal( saved.time, '13:00' )
        assert.equal( saved.partySize, 4 )
        assert.equal( saved.table, 1 )
        assert.equal( saved.reminderSent, true )
        assert.equal( saved.status, 'confirmed' )
        assert.equal( fake.mailer.calls.length, 0 )
    })
})

describe( 'PATCH /api/reservations/:token/cancel (cancelReservation)', () => {

    test( 'con un token que no existe o mal formado responde 404', async () => {
        for ( const token of [ TOKEN_MISSING, 'abc' ] ) {
            const { res } = await fake.callHandler( cancelReservation, { params: { token } } )
            assert.equal( res.statusCode, 404 )
            assert.deepEqual( res.body, { message: NOT_FOUND, data: null } )
        }
    })

    /* Cancelar una reserva futura: 200, queda como 'cancelled' (no se borra) y se manda el correo
    de cancelación con la invitación CANCEL, que quita el evento del calendario */
    test( 'cancela una reserva confirmada futura y manda el correo', async () => {
        storedReservation()
        const { res } = await fake.callHandler( cancelReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'Reserva cancelada' )
        assert.deepEqual( res.body.data, {
            date: '2026-12-01',
            time: '13:00',
            partySize: 4,
            name: 'Lucía Pérez',
            notes: 'Una trona',
            status: 'cancelled',
            isPast: false
        })
        assert.equal( fake.store.reservations.length, 1 )
        assert.equal( fake.getReservationByToken( TOKEN_A ).status, 'cancelled' )

        assert.equal( fake.mailer.calls.length, 1 )
        const email = fake.mailer.calls[ 0 ]
        assert.deepEqual( email.to, { email: 'lucia@ejemplo.es', name: 'Lucía Pérez' } )
        assert.match( email.subject, /^Reserva cancelada/ )
        assert.ok( email.html.includes( 'http://localhost:3000/reservar' ) )
        assert.equal( email.attachments[ 0 ].name, 'invite.ics' )
        const ics = email.attachments[ 0 ].content
        assert.equal( icsValue( ics, 'METHOD' ), 'CANCEL' )
        assert.ok( Number( icsValue( ics, 'SEQUENCE' ) ) > 0 )
    })

    /* Repetir la cancelación no es un error: 200 con otro mensaje y sin volver a mandar el correo */
    test( 'cancelar dos veces responde 200 "ya estaba cancelada" sin otro correo', async () => {
        storedReservation()
        await fake.callHandler( cancelReservation, { params: { token: TOKEN_A } } )
        const { res } = await fake.callHandler( cancelReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'La reserva ya estaba cancelada' )
        assert.equal( res.body.data.status, 'cancelled' )
        assert.equal( fake.mailer.calls.length, 1 )
    })

    test( 'una reserva que ya ha empezado no se cancela: 409', async () => {
        storedReservation({ date: '2026-11-25', time: '09:00' })
        const { res } = await fake.callHandler( cancelReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: STARTED, data: null } )
        assert.equal( fake.getReservationByToken( TOKEN_A ).status, 'confirmed' )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Una reserva pasada que ya estaba cancelada responde 200 "ya estaba cancelada": ese caso se mira antes que "empezada" */
    test( 'una reserva pasada y cancelada responde 200 "ya estaba cancelada"', async () => {
        storedReservation({ date: '2026-11-20', status: 'cancelled' })
        const { res } = await fake.callHandler( cancelReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'La reserva ya estaba cancelada' )
        assert.equal( res.body.data.isPast, true )
    })
})
