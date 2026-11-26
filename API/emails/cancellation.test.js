
/* Tests del correo de cancelación. Se lanzan con npm test.
Usan una reserva inventada: sábado 28 de noviembre de 2026 a las 21:00, para 4 personas */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { buildCancellationEmail } = require( './cancellation' )

const RESERVATION = {
    name: 'Ana',
    date: '2026-11-28',
    time: '21:00',
    partySize: 4,
    bookingUrl: 'https://mesonlapaloma.es/reservar'
}

test( 'el asunto lleva el día y la hora', () => {
    const { subject } = buildCancellationEmail( RESERVATION )

    assert.equal( subject, 'Reserva cancelada: sábado 28 de noviembre a las 21:00' )
})

test( 'el html y el texto llevan el enlace, la hora y las personas', () => {
    const { html, text } = buildCancellationEmail( RESERVATION )

    for ( const body of [ html, text ] ) {
        assert.ok( body.includes( RESERVATION.bookingUrl ) )
        assert.ok( body.includes( '21:00' ) )
        assert.ok( body.includes( '4 personas' ) )
    }
})

test( 'escapa el nombre que escribe el cliente', () => {
    const { html } = buildCancellationEmail({ ...RESERVATION, name: '<b>Ana</b>' })

    assert.ok( html.includes( '&lt;b&gt;Ana&lt;/b&gt;' ) )
    assert.ok( !html.includes( '<b>Ana</b>' ) )
})

test( 'el html lleva el título de reserva cancelada', () => {
    const { html } = buildCancellationEmail( RESERVATION )

    assert.ok( html.includes( 'Reserva cancelada' ) )
})

test( 'el html y el texto avisan de que la invitación quita la reserva del calendario', () => {
    const { html, text } = buildCancellationEmail( RESERVATION )
    const note = 'Si añadiste la reserva a tu calendario, la invitación de este correo la quita.'

    assert.ok( html.includes( note ) )
    assert.ok( text.includes( note ) )
})
