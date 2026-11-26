
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
    now: new Date( '2026-11-26T10:15:00Z' ),
    organizer: { name: 'Mesón La Paloma', email: 'meson@ejemplo.es' },
    attendee: { name: 'Ana', email: 'ana@ejemplo.es' }
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

test( 'lleva SEQUENCE: 0 por defecto y el número que se pasa', () => {
    assert.ok( buildCalendarEvent( EVENT ).includes( 'SEQUENCE:0\r\n' ) )
    assert.ok( buildCalendarEvent({ ...EVENT, sequence: 1795000000 }).includes( 'SEQUENCE:1795000000\r\n' ) )
})

test( 'por defecto es una invitación: METHOD:REQUEST y STATUS:CONFIRMED', () => {
    const ics = buildCalendarEvent( EVENT )

    assert.ok( ics.includes( 'METHOD:REQUEST\r\n' ) )
    assert.ok( ics.includes( 'STATUS:CONFIRMED\r\n' ) )
    assert.ok( !ics.includes( 'METHOD:PUBLISH' ) )
})

test( 'con method CANCEL lleva METHOD:CANCEL y STATUS:CANCELLED', () => {
    const ics = buildCalendarEvent({ ...EVENT, method: 'CANCEL' })

    assert.ok( ics.includes( 'METHOD:CANCEL\r\n' ) )
    assert.ok( ics.includes( 'STATUS:CANCELLED\r\n' ) )
    assert.ok( !ics.includes( 'METHOD:REQUEST' ) )
})

test( 'lleva el organizador con su nombre y su correo', () => {
    const ics = buildCalendarEvent( EVENT )

    assert.ok( ics.includes( 'ORGANIZER;CN="Mesón La Paloma":mailto:meson@ejemplo.es\r\n' ) )
})

test( 'lleva al cliente como asistente que ya ha aceptado y sin pedir respuesta', () => {
    const ics = buildCalendarEvent( EVENT )

    assert.ok( ics.includes( 'ATTENDEE;CN="Ana";ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:ana@ejemplo.es\r\n' ) )
})

test( 'escapa el nombre del asistente: entre comillas, sin comillas ni saltos de línea dentro', () => {
    const ics = buildCalendarEvent({ ...EVENT, attendee: { name: 'Ana "la de\nPérez", Madrid', email: 'ana@ejemplo.es' } })

    assert.ok( ics.includes( 'ATTENDEE;CN="Ana la de Pérez, Madrid";' ) )
})
