
/* Límite de peticiones por IP, con express-rate-limit. Sin él, alguien podría lanzar miles de reservas
o de cambios seguidos: llenar el comedor de reservas falsas o mandar un montón de correos.
Cada limitador cuenta las peticiones de cada IP en una ventana de tiempo (windowMs) y, al pasar de limit,
responde 429 (Too Many Requests) con el formato de siempre: { message, data: null }.
Las cuentas se guardan en la memoria del proceso: si la API se reinicia, empiezan de cero.

AVISO para cuando la API se publique detrás de un proxy (Render, Railway…): todas las peticiones llegarán
desde la IP del proxy y el límite sería para todos los clientes a la vez. Habrá que configurar en index.js
app.set( 'trust proxy', … ) con el número de proxies que pone el proveedor, para que req.ip sea la del cliente */
const { rateLimit } = require( 'express-rate-limit' )

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

/* Las opciones comunes a los tres limitadores.
- standardHeaders 'draft-8': manda las cabeceras RateLimit y RateLimit-Policy del estándar, para que el cliente sepa cuántas le quedan.
- legacyHeaders false: sin las cabeceras antiguas X-RateLimit-*.
- message: el cuerpo de la respuesta 429, con nuestro formato */
const createLimiter = ({ windowMs, limit, message }) => rateLimit({
    windowMs,
    limit,
    statusCode: 429,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message, data: null }
})

/* Crear reserva (POST /reservations): 10 por hora por IP. Una familia no hace más; un robot, sí */
const createReservationLimiter = createLimiter({
    windowMs: HOUR_MS,
    limit: 10,
    message: 'Has hecho demasiadas reservas seguidas. Inténtalo más tarde o llámanos'
})

/* Modificar y cancelar (PATCH /reservations/:token y /cancel): 20 por hora por IP, contadas juntas.
Cada cambio manda un correo, así que también protege al cliente de recibir correos en bucle */
const changeReservationLimiter = createLimiter({
    windowMs: HOUR_MS,
    limit: 20,
    message: 'Demasiados cambios seguidos. Inténtalo más tarde o llámanos'
})

/* El resto de la API, las lecturas (carta, días, horas libres, "Mi reserva"): 120 por minuto por IP.
Es generoso para quien usa la web, pero frena a quien intente probar códigos de reserva a lo bruto */
const readLimiter = createLimiter({
    windowMs: MINUTE_MS,
    limit: 120,
    message: 'Demasiadas peticiones. Espera un momento'
})

/* Exportamos los limitadores para el router */
module.exports = {
    createReservationLimiter,
    changeReservationLimiter,
    readLimiter
}
