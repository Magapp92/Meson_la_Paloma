
/* Reglas de las reservas, en un solo sitio: si cambia algo (un horario, la antelación…), se cambia aquí */
const BOOKING_RULES = Object.freeze({
    /* Cada cuántos minutos hay una hora para elegir (13:00, 13:15, 13:30…) */
    slotMinutes: 15,
    /* Cuánto tiempo queda ocupada una mesa con cada reserva */
    durationMinutes: 90,
    /* Antelación: como mínimo 2 horas antes y como máximo 30 días vista */
    minNoticeMinutes: 120,
    maxDaysAhead: 30,
    /* Personas por reserva. Más de 6 es un grupo y se reserva por teléfono */
    minPartySize: 2,
    maxPartySize: 6,
    /* Servicios: primera y última hora de entrada */
    services: Object.freeze({
        lunch: Object.freeze({ first: '13:00', last: '16:00' }),
        dinner: Object.freeze({ first: '19:00', last: '22:00' })
    }),
    /* Qué servicios hay cada día de la semana, en el orden de JavaScript: 0 es domingo y 6 es sábado.
    Domingo solo comidas (cierra a las 17:00) y lunes cerrado */
    servicesByDay: Object.freeze([
        [ 'lunch' ],
        [],
        [ 'lunch', 'dinner' ],
        [ 'lunch', 'dinner' ],
        [ 'lunch', 'dinner' ],
        [ 'lunch', 'dinner' ],
        [ 'lunch', 'dinner' ]
    ])
})

module.exports = {
    BOOKING_RULES
}
