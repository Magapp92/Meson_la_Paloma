
/* Arranque de la API del Mesón La Paloma: Express, cors, la conexión a Mongo y las rutas */
console.clear()
console.log( 'Iniciando la API del Mesón La Paloma' )

const express = require( 'express' )
const cors = require( 'cors' )
const { connect } = require( './config/db' )
const { router } = require( './routes/router' )
const { notFound, errorHandler } = require( './middlewares/errors' )

/* Leemos las variables del .env: el puerto (la conexión a Mongo la lee db.js) */
require( 'dotenv' ).config({ quiet: true })
const { PORT = 4000 } = process.env

const app = express()

/* Quitamos la cabecera X-Powered-By: Express, que Express pone en cada respuesta.
No aporta nada al cliente y le dice a un atacante qué tecnología usamos */
app.disable( 'x-powered-by' )

/* CORS: solo la web del mesón (SITE_URL) puede llamar a la API desde el navegador.
Si SITE_URL no está definida, no abrimos la API a cualquier web: permitimos solo la web en local (localhost:3000) */
app.use( cors({ origin: process.env.SITE_URL || 'http://localhost:3000' }) )

/* Leemos el body en JSON, con un máximo de 10 kb: una reserva ocupa mucho menos.
Si llega algo más grande, express.json lo rechaza (413) sin leerlo entero */
app.use( express.json({ limit: '10kb' }) )

/* Antes de cada petición comprobamos que hay conexión con Mongo; si no, respondemos 503 */
app.use( async ( req, res, next ) => {
    try {
        await connect()
        next()
    } catch ( error ) {
        console.log( `Sin conexión a MongoDB: ${ error.message }` )
        res.status( 503 ).json({
            message: 'Base de datos no disponible, inténtalo en unos segundos',
            data: null
        })
    }
})

/* Todas las rutas cuelgan de /api */
app.use( '/api', router )

/* Si ninguna ruta coincide devolvemos 404, y recogemos todos los errores */
app.use( notFound )
app.use( errorHandler )

/* Conectamos al arrancar para ver en la consola si Mongo responde (sin mostrar la cadena de conexión) */
connect()
    .then( () => console.log( 'Conectado a MongoDB' ) )
    .catch( error => console.log( `Sin conexión a MongoDB: ${ error.message }` ) )

app.listen( PORT, () => {
    console.log( `API en http://localhost:${ PORT }/api` )
})
