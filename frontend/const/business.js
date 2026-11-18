
/* Datos del mesón que usan varias partes de la web */

/* Datos de contacto. El teléfono va dos veces: como se lee y como lo entiende el móvil para llamar
(tel: con el prefijo de España y sin espacios). directionsHref abre Google Maps con la dirección
y mapEmbedSrc es el mapa para insertar en la web (el mismo que tenía la web antigua) */
export const CONTACT = Object.freeze({
    phone: '608 83 65 64',
    phoneHref: 'tel:+34608836564',
    email: 'info@mesonlapaloma.com',
    street: 'C/ Artajona, 9',
    city: '28039 Madrid',
    directionsHref: 'https://www.google.com/maps/search/?api=1&query=Calle%20de%20Artajona%209%2C%2028039%20Madrid',
    mapEmbedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3034.601229524345!2d-3.7229303851056427!3d40.454406279364575!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd42284269d4db13%3A0xc10ef3e24183d5e0!2sCalle%20de%20Artajona%2C%209%2C%2028039%20Madrid%2C%20Spain!5e0!3m2!1ses!2ses'
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
