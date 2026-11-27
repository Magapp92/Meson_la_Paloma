
/* Tests del correo de recordatorio. Se lanzan con npm test.
Usan una reserva inventada: sábado 28 de noviembre de 2026 a las 21:00, para 4 personas */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { buildReminderEmail } = require( './reminder' )

const RESERVATION = {
    name: 'Ana',
    date: '2026-11-28',
    time: '21:00',
    partySize: 4,
    manageUrl: 'https://mesonlapaloma.es/mi-reserva?codigo=abc123'
}

test( 'el asunto lleva el día y la hora', () => {
    const { subject } = buildReminderEmail( RESERVATION )

    assert.equal( subject, 'Te esperamos mañana: sábado 28 de noviembre a las 21:00' )
})

test( 'el html y el texto llevan el enlace, la hora y las personas', () => {
    const { html, text } = buildReminderEmail( RESERVATION )

    for ( const body of [ html, text ] ) {
        assert.ok( body.includes( RESERVATION.manageUrl ) )
        assert.ok( body.includes( '21:00' ) )
        assert.ok( body.includes( '4 personas' ) )
    }
})

test( 'escapa el nombre que escribe el cliente', () => {
    const { html } = buildReminderEmail({ ...RESERVATION, name: '<b>Ana</b>' })

    assert.ok( html.includes( '&lt;b&gt;Ana&lt;/b&gt;' ) )
    assert.ok( !html.includes( '<b>Ana</b>' ) )
})

test( 'el html lleva el título "Te esperamos mañana"', () => {
    const { html } = buildReminderEmail( RESERVATION )

    assert.ok( html.includes( 'Te esperamos mañana' ) )
})
