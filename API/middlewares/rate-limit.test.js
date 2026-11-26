
/* Test del límite de peticiones al crear reservas. Se lanza con npm test.
Monta una mini API de Express solo con el limitador y un handler de prueba (no crea reservas ni manda correos)
y la arranca en un puerto libre de este mismo ordenador (listen( 0 )): las peticiones no salen a la red */
const { test, after } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const express = require( 'express' )
const { createReservationLimiter } = require( './rate-limit' )

const app = express()
app.post( '/reservations', createReservationLimiter, ( req, res ) => res.status( 201 ).json({ message: 'ok', data: null }) )

const server = app.listen( 0 )
after( () => server.close() )

test( 'crear reserva: las 10 primeras pasan y a partir de la 11 responde 429', async () => {
    const url = `http://localhost:${ server.address().port }/reservations`

    for ( let i = 1; i <= 10; i++ ) {
        const response = await fetch( url, { method: 'POST' } )
        assert.equal( response.status, 201, `la petición ${ i } debería pasar` )
    }

    for ( let i = 11; i <= 12; i++ ) {
        const response = await fetch( url, { method: 'POST' } )
        assert.equal( response.status, 429, `la petición ${ i } debería quedar bloqueada` )
        assert.deepEqual( await response.json(), {
            message: 'Has hecho demasiadas reservas seguidas. Inténtalo más tarde o llámanos',
            data: null
        })
        /* Cabeceras estándar sí, las antiguas X-RateLimit-* no */
        assert.ok( response.headers.get( 'ratelimit' ) )
        assert.equal( response.headers.get( 'x-ratelimit-limit' ), null )
    }
})
