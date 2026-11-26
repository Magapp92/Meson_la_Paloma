
/* Tests del correo de confirmación. Se lanzan con npm test.
Usan una reserva inventada: sábado 28 de noviembre de 2026 a las 21:00, para 4 personas */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { buildConfirmationEmail, formatLongDate } = require( './confirmation' )

const RESERVATION = {
    name: 'Ana',
    date: '2026-11-28',
    time: '21:00',
    partySize: 4,
    manageUrl: 'https://mesonlapaloma.es/reserva/abc123'
}

test( 'escribe la fecha entera en español, sin comas', () => {
    assert.equal( formatLongDate( '2026-11-28' ), 'sábado 28 de noviembre' )
    assert.equal( formatLongDate( '2026-12-01' ), 'martes 1 de diciembre' )
})

test( 'el asunto lleva el día y la hora', () => {
    const { subject } = buildConfirmationEmail( RESERVATION )

    assert.equal( subject, 'Reserva confirmada: sábado 28 de noviembre a las 21:00' )
})

test( 'el html y el texto llevan el enlace, la hora y las personas', () => {
    const { html, text } = buildConfirmationEmail( RESERVATION )

    for ( const body of [ html, text ] ) {
        assert.ok( body.includes( RESERVATION.manageUrl ) )
        assert.ok( body.includes( '21:00' ) )
        assert.ok( body.includes( '4 personas' ) )
    }
})

test( 'escapa el nombre que escribe el cliente', () => {
    const { html } = buildConfirmationEmail({ ...RESERVATION, name: '<b>Ana</b>' })

    assert.ok( html.includes( '&lt;b&gt;Ana&lt;/b&gt;' ) )
    assert.ok( !html.includes( '<b>Ana</b>' ) )
})

test( 'la línea de notas solo sale si hay notas', () => {
    const withoutNotes = buildConfirmationEmail( RESERVATION )
    const withNotes = buildConfirmationEmail({ ...RESERVATION, notes: 'Trona para un bebé' })

    assert.ok( !withoutNotes.html.includes( 'Notas' ) )
    assert.ok( !withoutNotes.text.includes( 'Notas' ) )
    assert.ok( withNotes.html.includes( 'Notas' ) )
    assert.ok( withNotes.html.includes( 'Trona para un bebé' ) )
    assert.ok( withNotes.text.includes( 'Notas: Trona para un bebé' ) )
})

test( 'con isUpdate, el asunto y el título dicen "Reserva modificada"', () => {
    const { subject, html, text } = buildConfirmationEmail({ ...RESERVATION, isUpdate: true })

    assert.equal( subject, 'Reserva modificada: sábado 28 de noviembre a las 21:00' )
    assert.ok( html.includes( 'Reserva modificada' ) )
    assert.ok( !html.includes( 'Reserva confirmada' ) )
    assert.ok( text.includes( 'Estos son los datos nuevos de tu reserva:' ) )
    assert.ok( html.includes( RESERVATION.manageUrl ) )
})

test( 'el html y el texto avisan de la invitación de calendario, al confirmar y al modificar', () => {
    const note = 'Este correo incluye la invitación de calendario: añádela y se actualizará sola si cambias o cancelas la reserva.'

    for ( const email of [ buildConfirmationEmail( RESERVATION ), buildConfirmationEmail({ ...RESERVATION, isUpdate: true }) ] ) {
        assert.ok( email.html.includes( note ) )
        assert.ok( email.text.includes( note ) )
    }
})
