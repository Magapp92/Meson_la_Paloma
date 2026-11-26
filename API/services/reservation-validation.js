
/* Validación de los datos de las reservas. Cada función devuelve el primer error que encuentre
(el mensaje que verá el cliente) o null si está todo bien. Las usan los controllers de reservas y de disponibilidad */
const { getDaySlots, parseDate, daysBetween } = require( './availability' )
const { BOOKING_RULES, FIELD_LIMITS } = require( './booking-rules' )
/* Caracteres de control y saltos de línea de Unicode (services/control-characters.js): no caben en un nombre,
un teléfono ni un correo, y podrían colar líneas nuevas en el correo o en la invitación de calendario */
const { CONTROL_CHARACTERS } = require( './control-characters' )

/* Los códigos que genera la API tienen 32 caracteres de [A-Za-z0-9_-]: si no tiene esa forma, ni consultamos la base de datos */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/

/* Un correo: algo, una arroba, algo, un punto y algo. Sin espacios ni los caracteres , ; : " < >,
que en una dirección de correo separan destinatarios o marcan el nombre y podrían añadir otro destinatario */
const EMAIL_PATTERN = /^[^\s,;:"<>]+@[^\s,;:"<>]+\.[^\s,;:"<>]+$/

/* La fecha tiene que ser un texto, existir y tener la forma AAAA-MM-DD */
const validateDate = date => typeof date === 'string' && parseDate( date ) ? null : 'La fecha no es válida: tiene que ser AAAA-MM-DD'

/* Un número entero de personas dentro de las reglas. Recibe el valor tal como llega: un número (4)
o un texto con un número ('4', como llega en la URL). Cualquier otra cosa no vale, tampoco una lista:
Number( [ 4 ] ) da 4, así que hay que mirarlo antes de convertir */
const validatePartySize = value => {
    const isNumberText = typeof value === 'string' && /^\d+$/.test( value.trim() )
    const partySize = typeof value === 'number' || isNumberText ? Number( value ) : NaN

    if ( !Number.isInteger( partySize ) || partySize < BOOKING_RULES.minPartySize || partySize > BOOKING_RULES.maxPartySize ) {
        return `Se reserva para ${ BOOKING_RULES.minPartySize } a ${ BOOKING_RULES.maxPartySize } personas. Para grupos más grandes, llámanos`
    }

    return null
}

/* Comprueba los datos de la mesa: día, hora y personas.
Va aparte de validateReservationForm porque al modificar una reserva solo llegan estos tres datos */
const validateBooking = ({ date, time, partySize }) => {
    const dateError = validateDate( date )
    if ( dateError ) return dateError
    if ( typeof time !== 'string' || !/^\d{2}:\d{2}$/.test( time ) ) return 'La hora no es válida: tiene que ser HH:MM'
    /* La hora tiene que ser una de las franjas de ese día: descarta los días cerrados y las horas fuera de servicio o sueltas (21:10) */
    if ( !getDaySlots( date ).includes( time ) ) return 'Ese día o a esa hora no se puede reservar. Elige una de las horas disponibles'

    return validatePartySize( partySize )
}

/* Comprueba los datos que llegan del formulario de reserva */
const validateReservationForm = ({ date, time, partySize, name, phone, email, notes }) => {
    const bookingError = validateBooking({ date, time, partySize })
    if ( bookingError ) return bookingError
    if ( typeof name !== 'string' || name.trim().length < 2 ) return 'Escribe tu nombre'
    if ( name.trim().length > FIELD_LIMITS.name ) return `El nombre puede tener como mucho ${ FIELD_LIMITS.name } caracteres`
    if ( CONTROL_CHARACTERS.test( name ) ) return 'Escribe tu nombre en una sola línea, sin saltos de línea'
    /* Un teléfono con al menos 9 cifras (puede llevar +, espacios o guiones) */
    if ( typeof phone !== 'string' || phone.replace( /\D/g, '' ).length < 9 ) return 'Escribe un teléfono válido'
    if ( phone.trim().length > FIELD_LIMITS.phone ) return `El teléfono puede tener como mucho ${ FIELD_LIMITS.phone } caracteres`
    if ( CONTROL_CHARACTERS.test( phone ) ) return 'Escribe el teléfono en una sola línea, sin saltos de línea'
    if ( typeof email !== 'string' || CONTROL_CHARACTERS.test( email ) || !EMAIL_PATTERN.test( email.trim() ) ) return 'Escribe un correo válido'
    if ( email.trim().length > FIELD_LIMITS.email ) return `El correo puede tener como mucho ${ FIELD_LIMITS.email } caracteres`
    if ( notes !== undefined && ( typeof notes !== 'string' || notes.length > FIELD_LIMITS.notes ) ) return `Las notas pueden tener como mucho ${ FIELD_LIMITS.notes } caracteres`

    return null
}

/* La fecha tiene que estar entre hoy y dentro de maxDaysAhead días (en hora de Madrid) */
const validateDaysAhead = ( date, now ) => {
    const daysAhead = daysBetween( now.date, date )
    if ( daysAhead < 0 || daysAhead > BOOKING_RULES.maxDaysAhead ) {
        return `Se puede reservar desde hoy hasta dentro de ${ BOOKING_RULES.maxDaysAhead } días`
    }

    return null
}

/* Exportamos las validaciones para los controllers de reservas y de disponibilidad */
module.exports = {
    TOKEN_PATTERN,
    validateDate,
    validatePartySize,
    validateBooking,
    validateReservationForm,
    validateDaysAhead
}
