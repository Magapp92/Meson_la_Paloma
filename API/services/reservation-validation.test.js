
/* Tests de la validación de las reservas. Se lanzan con npm test.
Usan una reserva inventada: martes 1 de diciembre de 2026 a las 21:00, para 4 personas */
const { test } = require( 'node:test' )
const assert = require( 'node:assert/strict' )
const { validatePartySize, validateBooking, validateReservationForm } = require( './reservation-validation' )

const FORM = {
    date: '2026-12-01',
    time: '21:00',
    partySize: 4,
    name: 'Lucía Pérez',
    phone: '600 123 456',
    email: 'lucia@ejemplo.es'
}

const PARTY_SIZE_ERROR = 'Se reserva para 2 a 6 personas. Para grupos más grandes, llámanos'
const EMAIL_ERROR = 'Escribe un correo válido'

test( 'un formulario correcto no da error', () => {
    assert.equal( validateReservationForm( FORM ), null )
})

test( 'las personas pueden llegar como número o como texto de número', () => {
    for ( const partySize of [ 2, 4, 6, '2', '6', ' 4 ' ] ) {
        assert.equal( validatePartySize( partySize ), null, `${ JSON.stringify( partySize ) } debería valer` )
    }
})

/* Number( [ 4 ] ) da 4: una lista con el número dentro no puede colarse como si fuera el número */
test( 'las personas no valen como lista, objeto, decimal, fuera de rango o vacías', () => {
    for ( const partySize of [ [ 4 ], [ '4' ], { value: 4 }, true, null, undefined, '', 'abc', '4.0', '2.5', 2.5, '1e1', '0x4', 1, 7, '8', NaN ] ) {
        assert.equal( validatePartySize( partySize ), PARTY_SIZE_ERROR, `${ JSON.stringify( partySize ) } no debería valer` )
    }
})

test( 'validateBooking y validateReservationForm rechazan las personas en una lista', () => {
    assert.equal( validateBooking({ date: FORM.date, time: FORM.time, partySize: [ 4 ] }), PARTY_SIZE_ERROR )
    assert.equal( validateReservationForm({ ...FORM, partySize: [ 4 ] }), PARTY_SIZE_ERROR )
    assert.equal( validateReservationForm({ ...FORM, partySize: '4' }), null )
})

test( 'acepta correos normales', () => {
    for ( const email of [ 'lucia@ejemplo.es', 'lucia.perez+reservas@correo.ejemplo.es', ' lucia@ejemplo.es ' ] ) {
        assert.equal( validateReservationForm({ ...FORM, email }), null, `${ email } debería valer` )
    }
})

/* Sin espacios dentro, ni , ; : " < > (podrían añadir otro destinatario), ni caracteres de control */
test( 'rechaza correos con espacios, caracteres especiales o de control', () => {
    const emails = [
        'lucia-ejemplo.es',
        'lucia @ejemplo.es',
        'lucia@ejemplo .es',
        'lucia@ejemplo.es,otro@ejemplo.es',
        'lucia@ejemplo.es;otro@ejemplo.es',
        'lucia:x@ejemplo.es',
        '"lucia"@ejemplo.es',
        'Lucía <lucia@ejemplo.es>',
        'lucia@ejemplo.es\nBcc: otro@ejemplo.es',
        'lucia@ejemplo.es\n',
        'lucia\u0001@ejemplo.es',
        'lucia@ejemplo.es\u2028',
        'lucia\u202E@ejemplo.es',
        'lucia\u00A0@ejemplo.es'
    ]

    for ( const email of emails ) {
        assert.equal( validateReservationForm({ ...FORM, email }), EMAIL_ERROR, `${ JSON.stringify( email ) } no debería valer` )
    }
})

/* Además de los caracteres de control de siempre, los saltos de línea de Unicode y los que cambian la dirección del texto */
test( 'rechaza el nombre con saltos de línea de Unicode o caracteres de dirección del texto', () => {
    for ( const character of [ '\n', '\t', '\u0085', '\u2028', '\u2029', '\u202A', '\u202E', '\u2066', '\u2069' ] ) {
        assert.equal(
            validateReservationForm({ ...FORM, name: `Lucía${ character }Pérez` }),
            'Escribe tu nombre en una sola línea, sin saltos de línea',
            `el carácter ${ JSON.stringify( character ) } no debería valer`
        )
    }
})

test( 'rechaza el teléfono con saltos de línea de Unicode o caracteres de dirección del texto', () => {
    for ( const character of [ '\r', '\u0085', '\u2028', '\u2029', '\u202D', '\u2067' ] ) {
        assert.equal(
            validateReservationForm({ ...FORM, phone: `600 123${ character }456` }),
            'Escribe el teléfono en una sola línea, sin saltos de línea',
            `el carácter ${ JSON.stringify( character ) } no debería valer`
        )
    }
})
