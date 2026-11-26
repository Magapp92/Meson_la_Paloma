/* La app de Express de la API del Mesón La Paloma: cabeceras, cors, el body, la comprobación de Mongo, las rutas y los errores.
Está separada de index.js (que lee la configuración, conecta y arranca el servidor) para poder probarla
en los tests sin abrir el puerto 4000 ni conectar con MongoDB de verdad */
const express = require( 'express' )
const cors = require( 'cors' )
const { connect, isConnected } = require( './config/db' )
const { router } = require( './routes/router' )
const { notFound, errorHandler, SERVICE_UNAVAILABLE_MESSAGE } = require( './middlewares/errors' )

const app = express()

/* Quitamos la cabecera X-Powered-By: Express, que Express pone en cada respuesta.
No aporta nada al cliente y le dice a un atacante qué tecnología usamos */
app.disable( 'x-powered-by' )

/* Cabeceras de seguridad, a mano (sin instalar helmet: con estas dos nos basta).
- X-Content-Type-Options: nosniff, en todas las respuestas: el navegador no intenta adivinar el tipo
  y trata cada respuesta como lo que dice ser (JSON), nunca como HTML o script.
- Cache-Control: no-store en las reservas: llevan datos personales (nombre, teléfono, correo)
  y no deben quedarse guardadas en la caché del navegador ni de ningún proxy */
app.use( ( req, res, next ) => {
    res.set( 'X-Content-Type-Options', 'nosniff' )

    if ( /^\/api\/reservations(\/|$)/i.test( req.path ) ) {
        res.set( 'Cache-Control', 'no-store' )
    }

    next()
})

/* CORS: solo la web del mesón (SITE_URL) puede llamar a la API desde el navegador.
Si SITE_URL no está definida, no abrimos la API a cualquier web: permitimos solo la web en local (localhost:3000) */
app.use( cors({ origin: process.env.SITE_URL || 'http://localhost:3000' }) )

/* Leemos el body en JSON, con un máximo de 10 kb: una reserva ocupa mucho menos.
Si llega algo más grande, express.json lo rechaza (413) sin leerlo entero */
app.use( express.json({ limit: '10kb' }) )

/* Rutas que no usan la base de datos: la de prueba (/api) y los días que se pueden reservar (/api/days, se calculan
con el calendario). Funcionan aunque MongoDB no responda. Comparamos sin mayúsculas ni barra final, como hace Express */
const ROUTES_WITHOUT_DB = [ '/api', '/api/days' ]

/* Antes de cada petición comprobamos que hay conexión con Mongo; si no, respondemos 503.
Miramos dos cosas: que conectar no falle (al arrancar o si aún no había conexión) y que la conexión siga abierta
(si se perdió después de arrancar, connect() ya está resuelto, pero las consultas fallarían) */
app.use( async ( req, res, next ) => {
    const path = req.path.toLowerCase().replace( /\/+$/, '' )
    if ( ROUTES_WITHOUT_DB.includes( path ) ) return next()

    try {
        await connect()
    } catch ( error ) {
        console.log( `Sin conexión a MongoDB: ${ error.message }` )
        return res.status( 503 ).json({ message: SERVICE_UNAVAILABLE_MESSAGE, data: null })
    }

    if ( !isConnected() ) {
        console.log( 'Sin conexión a MongoDB: la conexión está cerrada' )
        return res.status( 503 ).json({ message: SERVICE_UNAVAILABLE_MESSAGE, data: null })
    }

    next()
})

/* Todas las rutas cuelgan de /api */
app.use( '/api', router )

/* Si ninguna ruta coincide devolvemos 404, y recogemos todos los errores */
app.use( notFound )
app.use( errorHandler )

module.exports = {
    app
}
