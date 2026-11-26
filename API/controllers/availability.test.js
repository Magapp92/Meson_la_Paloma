/* Tests de caracterización del controller de disponibilidad (horas libres y días abiertos): fijan cómo
responde HOY, para que avisen si algo cambia al reorganizar el código.
Usan los dobles de test-helpers/fake-db.js (base en memoria con las mesas de data/tables.js y "ahora" fijo:
miércoles 25 de noviembre de 2026 a las 10:00). El 1 de diciembre es martes */
const { test, describe, beforeEach } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const fake = require( '../test-helpers/fake-db' )

/* Los dobles tienen que estar en require.cache antes de cargar el controller */
fake.install()
const { getAvailability, getDays } = require( './availability' )

const TOKEN_A = 'A'.repeat( 32 )

const PARTY_SIZE_ERROR = 'Se reserva para 2 a 6 personas. Para grupos más grandes, llámanos'

/* Pide las horas libres con la query que llegaría en la URL (todo en texto) */
const askAvailability = query => fake.callHandler( getAvailability, { query } )

/* Guarda una reserva confirmada del martes 1 de diciembre en una mesa y a una hora */
const reserve = ( table, time, overrides = {} ) => fake.insertReservation({
    date: '2026-12-01', time, partySize: 4, name: 'Cliente', phone: '600000000', email: 'cliente@ejemplo.es',
    table, token: `${ table }`.padStart( 32, 'x' ),
    ...overrides
})

beforeEach( () => {
    fake.resetDb()
    fake.resetMailer()
})

describe( 'GET /api/availability (getAvailability)', () => {

    /* Fecha que falta, mal escrita o imposible: 400 antes de consultar nada */
    test( 'con la fecha mal responde 400', async () => {
        for ( const date of [ undefined, '01/12/2026', '2026-13-01', '2026-02-30' ] ) {
            const { res } = await askAvailability({ date, partySize: '2' })
            assert.equal( res.statusCode, 400 )
            assert.deepEqual( res.body, { message: 'La fecha no es válida: tiene que ser AAAA-MM-DD', data: null } )
        }
    })

    /* Menos de 2, más de 6, sin número o con decimales: 400 */
    test( 'con las personas fuera de rango responde 400', async () => {
        for ( const partySize of [ undefined, '1', '7', 'abc', '2.5' ] ) {
            const { res } = await askAvailability({ date: '2026-12-01', partySize })
            assert.equal( res.statusCode, 400 )
            assert.deepEqual( res.body, { message: PARTY_SIZE_ERROR, data: null } )
        }
    })

    /* Un martes sin reservas: las 26 horas de comidas y cenas. partySize vuelve como número */
    test( 'un martes sin reservas devuelve todas sus horas', async () => {
        const { res, error } = await askAvailability({ date: '2026-12-01', partySize: '2' })

        assert.equal( error, null )
        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'Horas libres el 2026-12-01 para 2 personas' )
        assert.equal( res.body.data.date, '2026-12-01' )
        assert.equal( res.body.data.partySize, 2 )
        assert.equal( res.body.data.times.length, 26 )
        assert.equal( res.body.data.times[ 0 ], '13:00' )
        assert.equal( res.body.data.times.at( -1 ), '22:00' )
    })

    /* Con las tres mesas de 6 ocupadas a las 21:00, para 6 personas faltan las horas de 19:45 a 22:00.
    Las reservas canceladas no cuentan */
    test( 'quita las horas sin mesa y no cuenta las canceladas', async () => {
        reserve( 7, '21:00' )
        reserve( 8, '21:00' )
        reserve( 9, '21:00', { status: 'cancelled' } )

        const free = await askAvailability({ date: '2026-12-01', partySize: '6' })
        assert.equal( free.res.body.data.times.length, 26 )

        fake.store.reservations.find( reservation => reservation.table === 9 ).status = 'confirmed'
        const { res } = await askAvailability({ date: '2026-12-01', partySize: '6' })
        const { times } = res.body.data

        assert.ok( times.includes( '19:30' ) )
        assert.ok( !times.includes( '19:45' ) )
        assert.ok( !times.includes( '22:00' ) )
        assert.ok( times.includes( '13:00' ) )
    })

    /* exclude con el token de una reserva: esa reserva no cuenta como ocupada. La reserva está en la mesa 9
    a las 21:00 y las otras de 6 (7 y 8) también: sin exclude, a las 21:00 no hay sitio para 5; con exclude, sí */
    test( 'exclude con un token válido libera la mesa de esa reserva', async () => {
        reserve( 7, '21:00' )
        reserve( 8, '21:00' )
        reserve( 9, '21:00', { token: TOKEN_A } )

        const without = await askAvailability({ date: '2026-12-01', partySize: '5' })
        assert.ok( !without.res.body.data.times.includes( '21:00' ) )

        const { res } = await askAvailability({ date: '2026-12-01', partySize: '5', exclude: TOKEN_A })
        assert.equal( res.statusCode, 200 )
        assert.ok( res.body.data.times.includes( '21:00' ) )
    })

    /* Un exclude que no tiene la forma de un token (o que llega repetido y Express lo da como lista) se ignora */
    test( 'exclude mal formado se ignora', async () => {
        reserve( 7, '21:00' )
        reserve( 8, '21:00' )
        reserve( 9, '21:00', { token: TOKEN_A } )

        for ( const exclude of [ 'abc', TOKEN_A.slice( 1 ), [ TOKEN_A, TOKEN_A ] ] ) {
            const { res } = await askAvailability({ date: '2026-12-01', partySize: '5', exclude })
            assert.equal( res.statusCode, 200 )
            assert.ok( !res.body.data.times.includes( '21:00' ) )
        }
    })

    /* Un día fuera de plazo no da error: responde 200 con la lista vacía */
    test( 'un día fuera de plazo o cerrado responde 200 sin horas', async () => {
        for ( const date of [ '2026-11-24', '2026-12-26', '2026-11-30' ] ) {
            const { res } = await askAvailability({ date, partySize: '2' })
            assert.equal( res.statusCode, 200 )
            assert.deepEqual( res.body.data.times, [] )
        }
    })

    /* Hoy (el "ahora" fijo son las 10:00) solo salen horas con 2 horas de antelación: desde las 13:00 todas */
    test( 'hoy aplica la antelación mínima con el "ahora" fijo', async () => {
        const { res } = await askAvailability({ date: '2026-11-25', partySize: '2' })

        assert.equal( res.body.data.times[ 0 ], '13:00' )
        assert.equal( res.body.data.times.length, 26 )
    })
})

describe( 'GET /api/days (getDays)', () => {

    /* Los días abiertos desde el "ahora" fijo: del 25 de noviembre al 25 de diciembre, sin los lunes */
    test( 'devuelve los días en los que se puede reservar', async () => {
        const { res } = await fake.callHandler( getDays )

        assert.equal( res.statusCode, 200 )
        assert.equal( res.body.message, 'Días en los que se puede reservar' )
        const { days } = res.body.data
        assert.equal( days[ 0 ], '2026-11-25' )
        assert.equal( days.at( -1 ), '2026-12-25' )
        assert.ok( !days.includes( '2026-11-30' ) )
        assert.equal( days.length, 27 )
    })
})
