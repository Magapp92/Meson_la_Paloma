
/* Tests de los correos listos para enviar. Se lanzan con npm test.
SITE_URL de ejemplo, para no depender del .env */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { buildReminderMessage } = require( './reservation-emails' )

process.env.SITE_URL = 'https://mesonlapaloma.es'

const RESERVATION = {
    name: 'Ana',
    email: 'ana@example.com',
    date: '2026-11-28',
    time: '21:00',
    partySize: 4,
    token: 'abc123'
}

test( 'el recordatorio va al cliente, con el enlace de su reserva y sin adjuntos', () => {
    const message = buildReminderMessage( RESERVATION )
    const manageUrl = 'https://mesonlapaloma.es/mi-reserva?codigo=abc123'

    assert.deepEqual( message.to, { email: 'ana@example.com', name: 'Ana' } )
    assert.equal( message.subject, 'Te esperamos mañana: sábado 28 de noviembre a las 21:00' )
    assert.ok( message.html.includes( manageUrl ) )
    assert.ok( message.text.includes( manageUrl ) )
    assert.equal( message.attachments, undefined )
})
