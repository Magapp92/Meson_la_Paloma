
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

/* Largo máximo de cada dato del formulario, en caracteres. Los usan la validación y el schema de la reserva,
así el número está en un solo sitio. El correo, 254: el máximo que admite una dirección de correo */
const FIELD_LIMITS = Object.freeze({
    name: 80,
    phone: 30,
    email: 254,
    notes: 500
})

/* Cuántas reservas futuras puede tener a la vez un mismo contacto (mismo correo o mismo teléfono).
Para hacer más, tiene que llamar: así nadie llena el comedor con reservas falsas desde la web */
const MAX_ACTIVE_PER_CONTACT = 2

/* Versión de la política de privacidad que acepta el cliente al reservar: la fecha de su última actualización.
Se guarda en cada reserva para saber qué texto aceptó. Tiene que coincidir con LEGAL_UPDATED de la web
(frontend/const/legal.js): si cambia la política, se cambian las dos */
const PRIVACY_POLICY_VERSION = '2026-11-27'

module.exports = {
    BOOKING_RULES,
    FIELD_LIMITS,
    MAX_ACTIVE_PER_CONTACT,
    PRIVACY_POLICY_VERSION
}
