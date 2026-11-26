
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
