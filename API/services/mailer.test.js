
/* Tests del envío de correos. No tocan la red: cambiamos global.fetch por uno falso en cada test
y lo dejamos como estaba al acabar. La clave y el remitente son inventados */
const { test, beforeEach, afterEach } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { sendEmail } = require( './mailer' )

const realFetch = global.fetch
const realEnv = { ...process.env }

const email = { to: { email: 'lucia@ejemplo.es', name: 'Lucía Pérez' }, subject: 'Prueba', html: '<p>Hola</p>', text: 'Hola' }

/* Un fetch falso que apunta con qué se le llama y responde lo que le digamos */
const fakeFetch = respond => {
    const calls = []
    global.fetch = async ( url, options ) => {
        calls.push({ url, options })
        return respond()
    }

    return calls
}

beforeEach( () => {
    process.env.BREVO_API_KEY = 'clave-inventada'
    process.env.MAIL_FROM = 'meson@ejemplo.es'
})

afterEach( () => {
    global.fetch = realFetch
    process.env = { ...realEnv }
})

test( 'pasa a fetch un signal para cortar la espera', async () => {
    const calls = fakeFetch( () => ({ ok: true, json: async () => ({ messageId: 'falso-1' }) }) )

    const result = await sendEmail( email )

    assert.deepEqual( result, { messageId: 'falso-1' } )
    assert.equal( calls.length, 1 )
    assert.ok( calls[ 0 ].options.signal instanceof AbortSignal )
})

/* Si Brevo no responde a tiempo, fetch rechaza con un TimeoutError: sendEmail lo deja pasar */
test( 'si se agota el tiempo, sendEmail lanza el error', async () => {
    fakeFetch( () => { throw new DOMException( 'Tiempo agotado', 'TimeoutError' ) } )

    await assert.rejects( sendEmail( email ), { name: 'TimeoutError' } )
})

test( 'sin BREVO_API_KEY devuelve null y no llama a fetch', async t => {
    t.mock.method( console, 'warn', () => {} )
    delete process.env.BREVO_API_KEY
    const calls = fakeFetch( () => { throw new Error( 'No debería llamarse' ) } )

    assert.equal( await sendEmail( email ), null )
    assert.equal( calls.length, 0 )
})

/* El cuerpo que se manda a Brevo: remitente, destinatario, asunto, los dos cuerpos y el adjunto en base64 */
test( 'manda a Brevo el remitente, el destinatario, el asunto, los cuerpos y el adjunto en base64', async () => {
    process.env.MAIL_FROM_NAME = 'Mesón La Paloma'
    const calls = fakeFetch( () => ({ ok: true, json: async () => ({ messageId: 'falso-2' }) }) )
    const ics = 'BEGIN:VCALENDAR\r\nSUMMARY:Mesa en Mesón La Paloma\r\nEND:VCALENDAR\r\n'

    await sendEmail({ ...email, attachments: [ { name: 'invite.ics', content: ics } ] })

    const { url, options } = calls[ 0 ]
    assert.equal( url, 'https://api.brevo.com/v3/smtp/email' )
    assert.equal( options.method, 'POST' )
    assert.equal( options.headers[ 'api-key' ], 'clave-inventada' )

    const body = JSON.parse( options.body )
    assert.deepEqual( body.sender, { name: 'Mesón La Paloma', email: 'meson@ejemplo.es' } )
    assert.deepEqual( body.to, [ { email: 'lucia@ejemplo.es', name: 'Lucía Pérez' } ] )
    assert.equal( body.subject, 'Prueba' )
    assert.equal( body.htmlContent, '<p>Hola</p>' )
    assert.equal( body.textContent, 'Hola' )
    assert.equal( body.attachment.length, 1 )
    assert.equal( body.attachment[ 0 ].name, 'invite.ics' )
    assert.equal( Buffer.from( body.attachment[ 0 ].content, 'base64' ).toString( 'utf8' ), ics )
})

test( 'sin adjuntos no manda el campo attachment', async () => {
    const calls = fakeFetch( () => ({ ok: true, json: async () => ({ messageId: 'falso-3' }) }) )

    await sendEmail( email )

    assert.ok( !( 'attachment' in JSON.parse( calls[ 0 ].options.body ) ) )
})

/* Si Brevo responde con un error (4xx o 5xx), sendEmail lanza un Error con el código y el mensaje de Brevo */
test( 'si Brevo responde con error, sendEmail lanza con su mensaje', async () => {
    fakeFetch( () => ({ ok: false, status: 400, json: async () => ({ code: 'invalid_parameter', message: 'email is not valid' }) }) )
    await assert.rejects( sendEmail( email ), { message: 'Brevo no pudo enviar el correo (400): email is not valid' } )

    fakeFetch( () => ({ ok: false, status: 503, json: async () => { throw new SyntaxError( 'No es JSON' ) } }) )
    await assert.rejects( sendEmail( email ), { message: 'Brevo no pudo enviar el correo (503): error desconocido' } )
})
