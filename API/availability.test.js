
/* Tests del cálculo de horas libres. Se lanzan con npm test.
Usan las mesas reales (data/tables.js) y reservas inventadas, y fijan "ahora" para que den siempre lo mismo:
miércoles 25 de noviembre de 2026 a las 10:00. El 29 es domingo, el 30 lunes y el 1 de diciembre martes */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { toMinutes, toTime, parseDate, getDaySlots, pickTable, getAvailableTimes } = require( './availability' )
const { TABLES } = require( './data/tables' )

const NOW = { date: '2026-11-25', time: '10:00' }

/* Crea una reserva de prueba con lo mínimo que usa el cálculo */
const reservation = ( table, time, status = 'confirmed' ) => ({ table, time, status })

test( 'convierte horas en minutos y al revés', () => {
    assert.equal( toMinutes( '13:15' ), 795 )
    assert.equal( toTime( 795 ), '13:15' )
    assert.equal( toTime( 1320 ), '22:00' )
})

test( 'descarta las fechas mal escritas o que no existen', () => {
    assert.equal( parseDate( '2026-02-30' ), null )
    assert.equal( parseDate( '30/11/2026' ), null )
    assert.notEqual( parseDate( '2026-12-01' ), null )
})

test( 'un martes hay comidas y cenas, cada 15 minutos, hasta la última hora de entrada', () => {
    const slots = getDaySlots( '2026-12-01' )

    assert.equal( slots.length, 26 )
    assert.equal( slots[ 0 ], '13:00' )
    assert.ok( slots.includes( '16:00' ) )
    assert.ok( !slots.includes( '16:15' ) )
    assert.ok( slots.includes( '19:00' ) )
    assert.equal( slots.at( -1 ), '22:00' )
})

test( 'el domingo solo hay comidas y el lunes nada', () => {
    const sunday = getDaySlots( '2026-11-29' )

    assert.equal( sunday.length, 13 )
    assert.ok( !sunday.includes( '19:00' ) )
    assert.deepEqual( getDaySlots( '2026-11-30' ), [] )
})

test( 'elige la mesa más pequeña que valga', () => {
    const pick = partySize => pickTable({ tables: TABLES, reservations: [], time: '21:00', partySize }).number

    assert.equal( pick( 2 ), 10 )
    assert.equal( pick( 3 ), 1 )
    assert.equal( pick( 5 ), 7 )
})

test( 'si las mesas de su tamaño están ocupadas, da la siguiente más grande', () => {
    const reservations = [ reservation( 10, '21:00' ), reservation( 11, '20:30' ) ]
    const table = pickTable({ tables: TABLES, reservations, time: '21:00', partySize: 2 })

    assert.equal( table.seats, 4 )
})

test( 'una mesa queda ocupada 90 minutos desde la hora de la reserva', () => {
    const reservations = [ reservation( 10, '19:00' ), reservation( 11, '19:00' ) ]
    const pick = time => pickTable({ tables: TABLES, reservations, time, partySize: 2 }).seats

    /* A las 20:00 las dos mesas de 2 siguen ocupadas; a las 20:30 ya están libres */
    assert.equal( pick( '20:00' ), 4 )
    assert.equal( pick( '20:30' ), 2 )
})

test( 'no cuenta las reservas canceladas ni las mesas retiradas', () => {
    const reservations = [ reservation( 10, '21:00', 'cancelled' ) ]
    const tables = TABLES.map( table => table.number === 11 ? { ...table, active: false } : table )

    assert.equal( pickTable({ tables, reservations, time: '21:00', partySize: 2 }).number, 10 )
})

test( 'no da horas para menos de 2 personas ni para más de 6', () => {
    const times = partySize => getAvailableTimes({ date: '2026-12-01', partySize, tables: TABLES, reservations: [], now: NOW })

    assert.deepEqual( times( 1 ), [] )
    assert.deepEqual( times( 7 ), [] )
    assert.equal( times( 6 ).length, 26 )
})

test( 'solo deja reservar hasta 30 días vista y nunca en el pasado', () => {
    const times = date => getAvailableTimes({ date, partySize: 2, tables: TABLES, reservations: [], now: NOW })

    assert.ok( times( '2026-12-25' ).length > 0 )
    assert.deepEqual( times( '2026-12-26' ), [] )
    assert.deepEqual( times( '2026-11-24' ), [] )
})

test( 'hoy, solo las horas que quedan al menos 2 horas por delante', () => {
    const times = time => getAvailableTimes({ date: '2026-11-25', partySize: 2, tables: TABLES, reservations: [], now: { date: '2026-11-25', time } })

    assert.equal( times( '12:00' )[ 0 ], '14:00' )
    assert.deepEqual( times( '20:30' ), [] )
})

test( 'si todas las mesas que valen están ocupadas, esa hora no sale', () => {
    /* Las tres mesas de 6 reservadas a las 21:00: para 6 personas no hay sitio entre las 19:45 y las 22:00 */
    const reservations = [ reservation( 7, '21:00' ), reservation( 8, '21:00' ), reservation( 9, '21:00' ) ]
    const times = getAvailableTimes({ date: '2026-12-01', partySize: 6, tables: TABLES, reservations, now: NOW })

    assert.ok( times.includes( '19:30' ) )
    assert.ok( !times.includes( '19:45' ) )
    assert.ok( !times.includes( '22:00' ) )
    assert.ok( times.includes( '13:00' ) )
})
