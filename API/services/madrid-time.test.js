
/* Tests de la hora de Madrid. Se le pasa un instante fijo (en hora universal, la Z) para que den siempre lo mismo */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { getMadridNow, getStartOfNextDayInMadrid } = require( './madrid-time' )

test( 'en invierno Madrid va una hora por delante de la hora universal', () => {
    assert.deepEqual( getMadridNow( new Date( '2026-11-25T09:00:00Z' ) ), { date: '2026-11-25', time: '10:00' })
})

test( 'en verano va dos horas por delante, y a medianoche cambia el día', () => {
    assert.deepEqual( getMadridNow( new Date( '2026-07-01T22:30:00Z' ) ), { date: '2026-07-02', time: '00:30' })
})

/* El día siguiente empieza a las 00:00 de Madrid: en invierno son las 23:00 universales del día anterior */
test( 'en invierno el día siguiente empieza a las 23:00 universales', () => {
    assert.equal( getStartOfNextDayInMadrid( '2026-11-28' ).toISOString(), '2026-11-28T23:00:00.000Z' )
})

test( 'en verano el día siguiente empieza a las 22:00 universales', () => {
    assert.equal( getStartOfNextDayInMadrid( '2026-07-15' ).toISOString(), '2026-07-15T22:00:00.000Z' )
})

/* El 28 de marzo de 2027 se adelanta la hora: el 28 empieza aún en invierno y el 29 ya en verano */
test( 'alrededor del cambio de hora de marzo usa el desfase de cada día', () => {
    assert.equal( getStartOfNextDayInMadrid( '2027-03-27' ).toISOString(), '2027-03-27T23:00:00.000Z' )
    assert.equal( getStartOfNextDayInMadrid( '2027-03-28' ).toISOString(), '2027-03-28T22:00:00.000Z' )
})

/* El 31 de octubre de 2027 se atrasa la hora: el 31 empieza aún en verano y el 1 de noviembre ya en invierno */
test( 'alrededor del cambio de hora de octubre usa el desfase de cada día', () => {
    assert.equal( getStartOfNextDayInMadrid( '2027-10-30' ).toISOString(), '2027-10-30T22:00:00.000Z' )
    assert.equal( getStartOfNextDayInMadrid( '2027-10-31' ).toISOString(), '2027-10-31T23:00:00.000Z' )
})
