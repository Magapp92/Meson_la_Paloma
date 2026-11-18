
/* Datos del mesón que usan varias partes de la web */

/* Datos de contacto. El teléfono va dos veces: como se lee y como lo entiende el móvil para llamar
(tel: con el prefijo de España y sin espacios). directionsHref abre Google Maps con la dirección */
export const CONTACT = Object.freeze({
    phone: '608 83 65 64',
    phoneHref: 'tel:+34608836564',
    email: 'info@mesonlapaloma.com',
    street: 'C/ Artajona, 9',
    city: '28039 Madrid',
    directionsHref: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Artajona%209%2C%2028039%20Madrid'
})

/* Redes sociales, con los enlaces de la web antigua. Pendiente de confirmar con el mesón que siguen activas */
export const SOCIAL_LINKS = Object.freeze([
    { name: 'Instagram', href: 'https://www.instagram.com/mesonlapaloma/' },
    { name: 'Facebook', href: 'https://www.facebook.com/people/Mes%C3%B3n-La-Paloma/100090445720134/' },
    { name: 'X', href: 'https://x.com/mesonlapaloma' }
])

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
