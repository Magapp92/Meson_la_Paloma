
/* Tests del evento de calendario. Se lanzan con npm test.
Usan una reserva inventada: sábado 28 de noviembre de 2026 a las 21:00, 90 minutos */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { buildCalendarEvent } = require( './calendar-event' )

const EVENT = {
    uid: 'abc123@mesonlapaloma.com',
    title: 'Reserva en Mesón La Paloma',
    date: '2026-11-28',
    time: '21:00',
    durationMinutes: 90,
    timeZone: 'Europe/Madrid',
    location: 'C/ Artajona, 9, 28039 Madrid',
    now: new Date( '2026-11-26T10:15:00Z' )
}

test( 'las líneas van separadas por \\r\\n', () => {
    const ics = buildCalendarEvent( EVENT )
    const lines = ics.split( '\r\n' )

    assert.equal( lines[ 0 ], 'BEGIN:VCALENDAR' )
    assert.ok( lines.includes( 'END:VCALENDAR' ) )
    assert.ok( !ics.replace( /\r\n/g, '' ).includes( '\n' ) )
})

test( 'el inicio y el fin van en hora de Madrid', () => {
    const ics = buildCalendarEvent( EVENT )

    assert.ok( ics.includes( 'DTSTART;TZID=Europe/Madrid:20261128T210000\r\n' ) )
    assert.ok( ics.includes( 'DTEND;TZID=Europe/Madrid:20261128T223000\r\n' ) )
})

test( 'DTSTAMP es el "ahora" que se pasa, en UTC', () => {
    const ics = buildCalendarEvent( EVENT )

    assert.ok( ics.includes( 'DTSTAMP:20261126T101500Z\r\n' ) )
})

test( 'escapa las comas de la dirección', () => {
    const ics = buildCalendarEvent( EVENT )

    assert.ok( ics.includes( 'LOCATION:C/ Artajona\\, 9\\, 28039 Madrid\r\n' ) )
})

test( 'lleva el UID que se pasa', () => {
    const ics = buildCalendarEvent( EVENT )

    assert.ok( ics.includes( 'UID:abc123@mesonlapaloma.com\r\n' ) )
})
