
/* Tests de la hora de Madrid. Se le pasa un instante fijo (en hora universal, la Z) para que den siempre lo mismo */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { getMadridNow } = require( './madrid-time' )

test( 'en invierno Madrid va una hora por delante de la hora universal', () => {
    assert.deepEqual( getMadridNow( new Date( '2026-11-25T09:00:00Z' ) ), { date: '2026-11-25', time: '10:00' })
})

test( 'en verano va dos horas por delante, y a medianoche cambia el día', () => {
    assert.deepEqual( getMadridNow( new Date( '2026-07-01T22:30:00Z' ) ), { date: '2026-07-02', time: '00:30' })
})
