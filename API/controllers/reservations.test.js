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
const { postReservation, getReservation, updateReservation, cancelReservation } = require( './reservations' )
const { TOKEN_PATTERN } = require( '../services/reservation-validation' )
const { sendEmailSafely } = require( '../services/notifications' )
/* Los modelos falsos que ha puesto install(): para forzar fallos con t.mock.method */
const { Reservation } = require( '../models' )

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
    privacyAccepted: true,
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

/* La reserva que acaba de guardar postReservation. La respuesta no trae el código secreto: solo llega por correo.
Así que la buscamos en la base falsa: es la única con el nombre del formulario (las demás se llaman 'Otra') */
const createdReservation = () => fake.getReservationByToken( fake.store.reservations.find( item => item.name === 'Lucía Pérez' ).token )

/* Valor de una línea del .ics adjunto: ( ics, 'METHOD' ) → 'REQUEST' */
const icsValue = ( ics, name ) => ics.split( '\r\n' ).find( line => line.startsWith( `${ name }:` ) )?.slice( name.length + 1 )

beforeEach( () => {
    fake.resetDb()
    fake.resetMailer()
})

describe( 'POST /api/reservations (postReservation)', () => {

    /* El caso bueno: responde 201 con los datos básicos (sin el código secreto, que solo va por correo), guarda la reserva en la mesa más pequeña
    que vale (para 4 personas, la 1) y manda un correo de confirmación con la invitación de calendario */
    test( 'con datos correctos crea la reserva, elige mesa y manda el correo', async () => {
        const { res, error } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( error, null )
        assert.equal( res.statusCode, 201 )
        assert.equal( res.body.message, 'Reserva confirmada' )
        assert.deepEqual( Object.keys( res.body.data ).sort(), [ 'date', 'name', 'partySize', 'time' ] )
        assert.equal( res.body.data.date, '2026-12-01' )
        assert.equal( res.body.data.time, '21:00' )
        assert.equal( res.body.data.partySize, 4 )
        assert.equal( res.body.data.name, 'Lucía Pérez' )
        assert.equal( 'token' in res.body.data, false )

        assert.equal( fake.store.reservations.length, 1 )
        const saved = createdReservation()
        assert.match( saved.token, TOKEN_PATTERN )
        assert.equal( saved.table, 1 )
        assert.equal( saved.status, 'confirmed' )
        assert.equal( saved.phone, '600 123 456' )
        assert.equal( saved.email, 'lucia@ejemplo.es' )
        assert.equal( saved.notes, 'Una trona' )

        assert.equal( fake.mailer.calls.length, 1 )
        const email = fake.mailer.calls[ 0 ]
        assert.deepEqual( email.to, { email: 'lucia@ejemplo.es', name: 'Lucía Pérez' } )
        assert.match( email.subject, /^Reserva confirmada/ )
        assert.ok( email.html.includes( `http://localhost:3000/mi-reserva?codigo=${ saved.token }` ) )
        assert.equal( email.attachments.length, 1 )
        assert.equal( email.attachments[ 0 ].name, 'invite.ics' )
        assert.equal( icsValue( email.attachments[ 0 ].content, 'METHOD' ), 'REQUEST' )
        assert.equal( icsValue( email.attachments[ 0 ].content, 'SEQUENCE' ), '0' )
    })

    /* Guarda cuándo aceptó la privacidad (la hora la pone la API) y qué versión; el campo privacyAccepted no se guarda */
    test( 'guarda cuándo se aceptó la privacidad y qué versión', async () => {
        const before = Date.now()
        await fake.callHandler( postReservation, { body: validBody() } )

        const saved = createdReservation()
        assert.ok( saved.privacyAcceptedAt instanceof Date )
        assert.ok( saved.privacyAcceptedAt.getTime() >= before && saved.privacyAcceptedAt.getTime() <= Date.now() )
        assert.equal( saved.privacyPolicyVersion, '2026-11-27' )
        assert.equal( 'privacyAccepted' in saved, false )
    })

    /* Sin la casilla marcada no se reserva: solo vale true (no "true", 1 ni que falte), y no se guarda nada ni sale correo */
    test( 'sin aceptar la privacidad responde 400 y no guarda nada', async () => {
        for ( const privacyAccepted of [ undefined, false, 'true', 1 ] ) {
            const { res } = await fake.callHandler( postReservation, { body: validBody({ privacyAccepted }) } )

            assert.equal( res.statusCode, 400 )
            assert.equal( res.body.message, 'Para reservar tienes que aceptar la política de privacidad' )
        }
        assert.equal( fake.store.reservations.length, 0 )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* La invitación de calendario usa el _id de la reserva como UID, no el código secreto:
    el UID se queda guardado en el calendario y no debe servir para modificar ni cancelar */
    test( 'el UID de la invitación usa el _id y no lleva el código secreto', async () => {
        await fake.callHandler( postReservation, { body: validBody() } )

        const saved = createdReservation()
        const ics = fake.mailer.calls[ 0 ].attachments[ 0 ].content
        assert.equal( icsValue( ics, 'UID' ), `${ saved._id }@mesonlapaloma.com` )
        assert.ok( !ics.includes( saved.token ) )
    })

    /* Para 2 personas la mesa más pequeña que vale es una de 2 (la 10) */
    test( 'para 2 personas elige la mesa de 2', async () => {
        const { res } = await fake.callHandler( postReservation, { body: validBody({ partySize: 2 }) } )

        assert.equal( res.statusCode, 201 )
        assert.equal( createdReservation().table, 10 )
    })

    /* status, table y token los pone la API: si llegan en el cuerpo se ignoran */
    test( 'ignora status, table y token si llegan en el cuerpo', async () => {
        const body = validBody({ status: 'cancelled', table: 99, token: TOKEN_B })
        const { res } = await fake.callHandler( postReservation, { body } )

        assert.equal( res.statusCode, 201 )
        const saved = createdReservation()
        assert.notEqual( saved.token, TOKEN_B )
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
        [ 'en el pasado', validBody({ date: '2026-11-24' }), 'Se puede reservar desde hoy hasta dentro de 30 días' ],
        /* La fecha tiene que llegar como texto: una lista con la fecha dentro no vale */
        [ 'fecha que no es texto', validBody({ date: [ '2026-12-01' ] }), 'La fecha no es válida: tiene que ser AAAA-MM-DD' ],
        /* Los largos máximos de cada dato (services/booking-rules.js, FIELD_LIMITS) */
        [ 'nombre de 81 caracteres', validBody({ name: 'a'.repeat( 81 ) }), 'El nombre puede tener como mucho 80 caracteres' ],
        [ 'teléfono de 31 caracteres', validBody({ phone: '6'.repeat( 31 ) }), 'El teléfono puede tener como mucho 30 caracteres' ],
        [ 'correo de 255 caracteres', validBody({ email: `${ 'a'.repeat( 244 ) }@ejemplo.es` }), 'El correo puede tener como mucho 254 caracteres' ],
        [ 'notas de 501 caracteres', validBody({ notes: 'a'.repeat( 501 ) }), 'Las notas pueden tener como mucho 500 caracteres' ],
        /* Sin caracteres de control: podrían colar líneas nuevas en el correo o en la invitación */
        [ 'nombre con salto de línea', validBody({ name: 'Lucía\nPérez' }), 'Escribe tu nombre en una sola línea, sin saltos de línea' ],
        [ 'nombre con retorno de carro', validBody({ name: 'Lucía\rPérez' }), 'Escribe tu nombre en una sola línea, sin saltos de línea' ],
        [ 'teléfono con tabulador', validBody({ phone: '600\t123 456' }), 'Escribe el teléfono en una sola línea, sin saltos de línea' ]
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
        assert.equal( createdReservation().status, 'confirmed' )
        assert.equal( fake.mailer.calls.length, 1 )
        assert.equal( consoleError.mock.callCount(), 1 )
    })

    /* Si el correo falla queda apuntado en la reserva (emailFailedAt) para que el mesón vea a quién no le llegó.
    En la consola sale el _id, el día y la hora, pero no los datos personales */
    test( 'si falla el correo, apunta emailFailedAt y la consola no lleva datos personales', async t => {
        const consoleError = t.mock.method( console, 'error', () => {} )
        fake.mailer.shouldFail = true

        await fake.callHandler( postReservation, { body: validBody() } )

        const saved = createdReservation()
        assert.ok( saved.emailFailedAt instanceof Date )
        const logged = consoleError.mock.calls[ 0 ].arguments.join( ' ' )
        assert.ok( logged.includes( saved._id ) )
        assert.ok( logged.includes( '2026-12-01 21:00' ) )
        for ( const personal of [ 'Lucía', 'lucia@ejemplo.es', '600 123 456' ] ) assert.ok( !logged.includes( personal ) )
    })

    /* Si el correo sale bien, no se apunta nada */
    test( 'si el correo sale bien, no hay emailFailedAt', async () => {
        await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( 'emailFailedAt' in createdReservation(), false )
    })

    /* Si falla el correo y además falla guardar emailFailedAt, la respuesta sigue siendo 201 y los dos fallos van a la consola */
    test( 'si no se puede guardar emailFailedAt, responde 201 igual', async t => {
        const consoleError = t.mock.method( console, 'error', () => {} )
        t.mock.method( Reservation, 'updateOne', async () => { throw new Error( 'Fallo simulado de la base de datos' ) } )
        fake.mailer.shouldFail = true

        const { res, error } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( error, null )
        assert.equal( res.statusCode, 201 )
        assert.equal( 'emailFailedAt' in createdReservation(), false )
        assert.equal( consoleError.mock.callCount(), 2 )
    })

    /* Doble clic o reintento del navegador: la segunda petición igual (mismo correo, aunque llegue con mayúsculas
    o espacios, día y hora) no crea otra reserva ni manda otro correo, y responde 201 con los mismos datos */
    test( 'una reserva repetida en menos de 10 minutos no crea otra ni manda otro correo', async () => {
        const first = await fake.callHandler( postReservation, { body: validBody() } )
        const second = await fake.callHandler( postReservation, { body: validBody({ email: '  LUCIA@ejemplo.es ' }) } )

        assert.equal( second.res.statusCode, 201 )
        assert.deepEqual( second.res.body, first.res.body )
        assert.equal( 'token' in second.res.body.data, false )
        assert.equal( fake.store.reservations.length, 1 )
        assert.equal( fake.mailer.calls.length, 1 )
    })

    /* Pasados los 10 minutos, o si la anterior está cancelada, sí se crea una nueva */
    test( 'una reserva igual de hace más de 10 minutos o cancelada no cuenta como repetida', async () => {
        const previous = { date: '2026-12-01', time: '21:00', partySize: 4, name: 'Lucía Pérez', phone: '600123456', email: 'lucia@ejemplo.es' }
        fake.insertReservation({ ...previous, table: 1, token: TOKEN_B, createdAt: new Date( Date.now() - 11 * 60 * 1000 ) })
        fake.insertReservation({ ...previous, table: 2, token: TOKEN_MISSING, status: 'cancelled' })

        const { res } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( res.statusCode, 201 )
        assert.equal( fake.store.reservations.length, 3 )
        assert.equal( fake.mailer.calls.length, 1 )
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

    /* El hueco de mirar solo las "anteriores": la otra reserva llega a la base a la vez, pero con createdAt
    POSTERIOR y _id mayor que la nueva (Mongoose los pone antes de insertar y no siguen el orden real).
    Con la comprobación simétrica también se detecta: la nueva se borra y responde 409. La otra se queda */
    test( 'si otra reserva posterior choca en la misma mesa, borra la nueva y responde 409', async () => {
        fake.hooks.afterCreate = created => {
            const other = fake.insertReservation({
                date: created.date, time: created.time, partySize: 4, name: 'Otra', phone: '600000000',
                email: 'otra@ejemplo.es', table: created.table, token: TOKEN_B,
                createdAt: new Date( created.createdAt.getTime() + 1 )
            })
            assert.ok( other._id > created._id )
        }

        const { res } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: NOT_FREE, data: null } )
        assert.equal( fake.store.reservations.length, 1 )
        assert.equal( fake.store.reservations[ 0 ].token, TOKEN_B )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Lo que no es choque no afecta: a la vez se guardan otra reserva a la misma hora en OTRA mesa
    y otra en la MISMA mesa justo 90 minutos después (21:00 → 22:30, ya no se pisan). La nueva se queda: 201 */
    test( 'una reserva en otra mesa o a 90 minutos o más no cuenta como choque', async () => {
        fake.hooks.afterCreate = created => {
            const other = { partySize: 4, name: 'Otra', phone: '600000000', email: 'otra@ejemplo.es', date: created.date }
            fake.insertReservation({ ...other, time: created.time, table: 2, token: TOKEN_B })
            fake.insertReservation({ ...other, time: '22:30', table: created.table, token: TOKEN_MISSING })
        }

        const { res } = await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( res.statusCode, 201 )
        assert.equal( fake.store.reservations.length, 3 )
        assert.equal( createdReservation().table, 1 )
        assert.equal( fake.mailer.calls.length, 1 )
    })

    /* Number( [ 4 ] ) da 4: las personas llegan a la validación sin convertir, y una lista no vale */
    test( 'responde 400 con las personas en una lista', async () => {
        const { res } = await fake.callHandler( postReservation, { body: validBody({ partySize: [ 4 ] }) } )

        assert.equal( res.statusCode, 400 )
        assert.deepEqual( res.body, { message: 'Se reserva para 2 a 6 personas. Para grupos más grandes, llámanos', data: null } )
        assert.equal( fake.store.reservations.length, 0 )
    })

    /* La reserva se borra sola al empezar en Madrid el día siguiente: el 1 de diciembre (invierno), a las 23:00 universales del día 1 */
    test( 'guarda expiresAt al empezar el día siguiente en Madrid', async () => {
        await fake.callHandler( postReservation, { body: validBody() } )

        assert.equal( createdReservation().expiresAt.toISOString(), '2026-12-01T23:00:00.000Z' )
    })

    /* Campo trampa relleno: un robot. Responde 201 con la respuesta de siempre, pero no guarda ni manda correo */
    test( 'con el campo trampa relleno responde 201 sin guardar ni mandar correo', async t => {
        const consoleWarn = t.mock.method( console, 'warn', () => {} )
        const { res, error } = await fake.callHandler( postReservation, { body: validBody({ website: 'https://spam.ejemplo' }) } )

        assert.equal( error, null )
        assert.equal( res.statusCode, 201 )
        assert.deepEqual( res.body, {
            message: 'Reserva confirmada',
            data: { date: '2026-12-01', time: '21:00', partySize: 4, name: 'Lucía Pérez' }
        })
        assert.equal( fake.store.reservations.length, 0 )
        assert.equal( fake.mailer.calls.length, 0 )
        assert.equal( consoleWarn.mock.callCount(), 1 )
        const logged = consoleWarn.mock.calls[ 0 ].arguments.join( ' ' )
        for ( const personal of [ 'Lucía', 'lucia@ejemplo.es', '600 123 456' ] ) assert.ok( !logged.includes( personal ) )
    })

    /* Campo trampa vacío o sin mandar: una persona. La reserva se hace y el campo no se guarda */
    test( 'con el campo trampa vacío o ausente la reserva se hace normal', async () => {
        for ( const body of [ validBody({ website: '' }), validBody() ] ) {
            fake.resetDb()
            const { res } = await fake.callHandler( postReservation, { body } )

            assert.equal( res.statusCode, 201 )
            assert.equal( fake.store.reservations.length, 1 )
            assert.equal( 'website' in createdReservation(), false )
        }
        assert.equal( fake.mailer.calls.length, 2 )
    })

    describe( 'tope de reservas activas por contacto', () => {

        const TOO_MANY = 'Ya tienes 2 reservas activas. Para hacer otra, llámanos'

        /* Una reserva confirmada y futura del mismo contacto, en otra mesa y otro día para que no ocupe la hora pedida */
        const previous = ( overrides = {} ) => fake.insertReservation({
            date: '2026-12-02', time: '13:00', partySize: 2, name: 'Lucía Pérez',
            phone: '600123456', email: 'lucia@ejemplo.es', table: 10, token: `${ fake.store.reservations.length }`.repeat( 32 ),
            ...overrides
        })

        test( 'con 1 reserva activa todavía puede hacer otra', async () => {
            previous()
            const { res } = await fake.callHandler( postReservation, { body: validBody() } )

            assert.equal( res.statusCode, 201 )
            assert.equal( fake.store.reservations.length, 2 )
        })

        test( 'la tercera con el mismo correo responde 409', async () => {
            previous({ phone: '611111111' })
            previous({ phone: '622222222', date: '2026-12-03' })
            const { res } = await fake.callHandler( postReservation, { body: validBody({ email: ' LUCIA@ejemplo.es' }) } )

            assert.equal( res.statusCode, 409 )
            assert.deepEqual( res.body, { message: TOO_MANY, data: null } )
            assert.equal( fake.store.reservations.length, 2 )
            assert.equal( fake.mailer.calls.length, 0 )
        })

        /* El mismo teléfono escrito de otra forma (espacios, guiones, +34) cuenta como el mismo */
        test( 'la tercera con el mismo teléfono escrito distinto responde 409', async () => {
            for ( const phone of [ '600 000 000', '+34600000000', '600-000-000' ] ) {
                fake.resetDb()
                previous({ email: 'una@ejemplo.es', phone: '600000000' })
                previous({ email: 'otra@ejemplo.es', phone: '+34 600 00 00 00', date: '2026-12-03' })

                const { res } = await fake.callHandler( postReservation, { body: validBody({ phone }) } )

                assert.equal( res.statusCode, 409, `${ phone } debería contar como el mismo teléfono` )
                assert.deepEqual( res.body, { message: TOO_MANY, data: null } )
            }
            assert.equal( fake.mailer.calls.length, 0 )
        })

        /* Solo cuentan las confirmadas y futuras: ni las canceladas, ni las de días pasados, ni las de hoy que ya han empezado
        (el "ahora" fijo es hoy a las 10:00) */
        test( 'las canceladas y las pasadas no cuentan', async () => {
            previous({ status: 'cancelled' })
            previous({ status: 'cancelled', date: '2026-12-03' })
            previous({ date: '2026-11-20' })
            previous({ date: '2026-11-25', time: '09:00' })
            previous()

            const { res } = await fake.callHandler( postReservation, { body: validBody() } )

            assert.equal( res.statusCode, 201 )
        })

        /* Un reintento de la segunda (en menos de 10 minutos) no cuenta como tercera: responde con la que hay */
        test( 'un reintento de la segunda no cuenta como tercera', async () => {
            previous()
            await fake.callHandler( postReservation, { body: validBody() } )
            const { res } = await fake.callHandler( postReservation, { body: validBody() } )

            assert.equal( res.statusCode, 201 )
            assert.equal( fake.store.reservations.length, 2 )
            assert.equal( fake.mailer.calls.length, 1 )
        })
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

    /* Al deshacer, el hueco antiguo (13:00 en la mesa 1) también lo ha ocupado otra reserva entretanto:
    no hay sitio seguro. Se apunta en la consola (_id, día y hora, sin datos personales) y responde 409 */
    test( 'si al deshacer el hueco antiguo también está ocupado, lo apunta en la consola y responde 409', async t => {
        const consoleError = t.mock.method( console, 'error', () => {} )
        const stored = storedReservation()
        const other = { partySize: 2, name: 'Otra', phone: '600000000', email: 'otra@ejemplo.es' }
        fake.hooks.afterUpdate = updated => {
            fake.insertReservation({ ...other, date: updated.date, time: updated.time, table: updated.table, token: TOKEN_B })
            fake.insertReservation({ ...other, date: '2026-12-01', time: '13:00', table: 1, token: TOKEN_MISSING })
        }

        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 2 }
        })

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: NOT_FREE, data: null } )
        assert.equal( fake.getReservationByToken( TOKEN_A ).time, '13:00' )
        assert.equal( consoleError.mock.callCount(), 1 )
        const logged = consoleError.mock.calls[ 0 ].arguments.join( ' ' )
        assert.ok( logged.includes( stored._id ) )
        assert.ok( logged.includes( '2026-12-01 13:00' ) )
        for ( const personal of [ 'Lucía', 'lucia@ejemplo.es', '600123456' ] ) assert.ok( !logged.includes( personal ) )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Mientras se guardaba el cambio, otra petición cancela la reserva. Al deshacer no se pisa la cancelación:
    la reserva queda cancelada con los datos que tenía al cancelarse (los nuevos), no con los antiguos */
    test( 'si se cancela a la vez, deshacer no pisa la cancelación', async t => {
        const consoleError = t.mock.method( console, 'error', () => {} )
        storedReservation()
        fake.hooks.afterUpdate = updated => {
            fake.insertReservation({
                date: updated.date, time: updated.time, partySize: 2, name: 'Otra', phone: '600000000',
                email: 'otra@ejemplo.es', table: updated.table, token: TOKEN_B
            })
            fake.store.reservations.find( item => item.token === TOKEN_A ).status = 'cancelled'
        }

        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 2 }
        })

        assert.equal( res.statusCode, 409 )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.status, 'cancelled' )
        assert.equal( saved.time, '21:00' )
        assert.equal( saved.partySize, 2 )
        assert.equal( saved.table, 10 )
        assert.equal( consoleError.mock.callCount(), 0 )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Modificar contra cancelar: la reserva se cancela entre la lectura y la escritura. findOneAndUpdate
    no la encuentra confirmada (devuelve null): 409 "cancelada", sin cambiar nada ni mandar correo */
    test( 'si se cancela entre la lectura y el guardado responde 409 "cancelada"', async () => {
        storedReservation()
        fake.hooks.beforeUpdate = () => {
            fake.store.reservations.find( item => item.token === TOKEN_A ).status = 'cancelled'
        }

        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 2 }
        })

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: 'Esta reserva está cancelada', data: null } )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.time, '13:00' )
        assert.equal( saved.status, 'cancelled' )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Dentro de las 2 horas de antelación no se cambia por la web: 409 con el mensaje de llamar, sin tocar nada.
    La reserva es de hoy a las 11:30 (el "ahora" fijo es las 10:00): no ha empezado, pero faltan 90 minutos */
    test( 'a menos de 2 horas de la reserva responde 409 "llámanos"', async () => {
        storedReservation({ date: '2026-11-25', time: '11:30' })
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 4 }
        })

        assert.equal( res.statusCode, 409 )
        assert.deepEqual( res.body, { message: 'Faltan menos de 2 horas para tu reserva: para cambiarla, llámanos', data: null } )
        assert.equal( fake.getReservationByToken( TOKEN_A ).date, '2026-11-25' )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Justo a 2 horas (12:00) todavía se puede cambiar */
    test( 'a 2 horas justas de la reserva todavía se puede cambiar', async () => {
        storedReservation({ date: '2026-11-25', time: '12:00' })
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 4 }
        })

        assert.equal( res.statusCode, 200 )
    })

    /* Si el correo de "modificada" falla, el cambio se mantiene y queda apuntado emailFailedAt */
    test( 'si falla el correo de modificada, apunta emailFailedAt', async t => {
        t.mock.method( console, 'error', () => {} )
        fake.mailer.shouldFail = true
        storedReservation()

        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: 2 }
        })

        assert.equal( res.statusCode, 200 )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.time, '21:00' )
        assert.ok( saved.emailFailedAt instanceof Date )
    })

    /* Number( [ 4 ] ) da 4: las personas llegan a la validación sin convertir, y una lista no vale */
    test( 'responde 400 con las personas en una lista', async () => {
        storedReservation()
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-01', time: '21:00', partySize: [ 4 ] }
        })

        assert.equal( res.statusCode, 400 )
        assert.deepEqual( res.body, { message: 'Se reserva para 2 a 6 personas. Para grupos más grandes, llámanos', data: null } )
        assert.equal( fake.getReservationByToken( TOKEN_A ).time, '13:00' )
    })

    /* Al cambiar de día se recalcula cuándo se borra: el 2 de diciembre, a las 23:00 universales del día 2 */
    test( 'al modificar recalcula expiresAt con el nuevo día', async () => {
        storedReservation({ expiresAt: new Date( '2026-12-01T23:00:00.000Z' ) })
        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-02', time: '20:00', partySize: 2 }
        })

        assert.equal( res.statusCode, 200 )
        assert.equal( fake.getReservationByToken( TOKEN_A ).expiresAt.toISOString(), '2026-12-02T23:00:00.000Z' )
    })

    /* Si el cambio choca y se deshace, expiresAt vuelve a ser el del día de antes */
    test( 'al deshacer un cambio expiresAt vuelve al del día de antes', async () => {
        storedReservation({ expiresAt: new Date( '2026-12-01T23:00:00.000Z' ) })
        fake.hooks.afterUpdate = updated => {
            fake.insertReservation({
                date: updated.date, time: updated.time, partySize: 2, name: 'Otra', phone: '600000000',
                email: 'otra@ejemplo.es', table: updated.table, token: TOKEN_B
            })
        }

        const { res } = await fake.callHandler( updateReservation, {
            params: { token: TOKEN_A },
            body: { date: '2026-12-02', time: '20:00', partySize: 2 }
        })

        assert.equal( res.statusCode, 409 )
        assert.equal( fake.getReservationByToken( TOKEN_A ).expiresAt.toISOString(), '2026-12-01T23:00:00.000Z' )
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

    /* Cancelar contra cancelar: otra petición la cancela entre la lectura y la escritura.
    findOneAndUpdate no la encuentra confirmada: 200 "ya estaba cancelada" y sin otro correo */
    test( 'si otra petición la cancela a la vez responde 200 "ya estaba cancelada"', async () => {
        storedReservation()
        fake.hooks.beforeUpdate = () => {
            fake.store.reservations.find( item => item.token === TOKEN_A ).status = 'cancelled'
        }

        const { res } = await fake.callHandler( cancelReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'La reserva ya estaba cancelada' )
        assert.equal( res.body.data.status, 'cancelled' )
        assert.equal( fake.mailer.calls.length, 0 )
    })

    /* Si el correo de cancelación falla, la reserva queda cancelada y con emailFailedAt */
    test( 'si falla el correo de cancelación, apunta emailFailedAt', async t => {
        t.mock.method( console, 'error', () => {} )
        fake.mailer.shouldFail = true
        storedReservation()

        const { res } = await fake.callHandler( cancelReservation, { params: { token: TOKEN_A } } )

        assert.equal( res.statusCode, 200 )
        const saved = fake.getReservationByToken( TOKEN_A )
        assert.equal( saved.status, 'cancelled' )
        assert.ok( saved.emailFailedAt instanceof Date )
    })
})

describe( 'sendEmailSafely (services/notifications.js)', () => {

    /* Devuelve true si el correo sale y false si falla; con un texto como contexto, lo añade al mensaje de la consola */
    test( 'devuelve true o false y añade el contexto al mensaje de la consola', async t => {
        const consoleError = t.mock.method( console, 'error', () => {} )

        assert.equal( await sendEmailSafely( () => ({ subject: 'Prueba' }), 'prueba', 'contexto de prueba' ), true )
        assert.equal( consoleError.mock.callCount(), 0 )

        fake.mailer.shouldFail = true
        assert.equal( await sendEmailSafely( () => ({ subject: 'Prueba' }), 'prueba', 'contexto de prueba' ), false )
        assert.equal( consoleError.mock.callCount(), 1 )
        assert.ok( consoleError.mock.calls[ 0 ].arguments[ 0 ].includes( '(contexto de prueba)' ) )
    })

    /* Si montar el correo falla también devuelve false, sin lanzar el error */
    test( 'si falla al montar el correo devuelve false', async t => {
        t.mock.method( console, 'error', () => {} )

        assert.equal( await sendEmailSafely( () => { throw new Error( 'Fallo al montar' ) }, 'prueba' ), false )
        assert.equal( fake.mailer.calls.length, 0 )
    })
})
