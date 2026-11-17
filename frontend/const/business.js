
/* Datos del mesón que usan varias partes de la web */

/* Zona horaria del mesón: el horario de hoy se calcula siempre con la hora de Madrid,
aunque quien visite la web esté en otro país */
export const TIME_ZONE = 'Europe/Madrid'

/* Nombres de los días en el mismo orden que los cuenta JavaScript: 0 es domingo y 6 es sábado */
export const DAY_NAMES = Object.freeze(['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'])

/* Horario de cada día, en el mismo orden que DAY_NAMES. null significa cerrado.
Cuando la hora de cierre es menor que la de apertura (01:00) el mesón cierra pasada la medianoche.
Pendiente de confirmar con el mesón que el lunes cierra */
export const OPENING_HOURS = Object.freeze([
    { open: '09:00', close: '17:00' },
    null,
    { open: '08:30', close: '01:00' },
    { open: '08:30', close: '01:00' },
    { open: '08:30', close: '01:00' },
    { open: '08:30', close: '01:00' },
    { open: '08:30', close: '01:00' }
])
