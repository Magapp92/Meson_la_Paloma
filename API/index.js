
/* Arranque de la API del Mesón La Paloma: Express, cors y las rutas.
La conexión a Mongo llegará en el siguiente paso */
console.clear()
console.log( 'Iniciando la API del Mesón La Paloma' )

const express = require( 'express' )
const cors = require( 'cors' )
const { notFound, errorHandler } = require( './middlewares' )

/* Leemos las variables del .env (el puerto y, más adelante, la conexión a Mongo) */
require( 'dotenv' ).config()
const { PORT = 4000 } = process.env

const app = express()

/* Middlewares para permitir peticiones del frontend y leer el body en JSON */
app.use( cors() )
app.use( express.json() )

/* Ruta de prueba: si responde, la API está en marcha */
app.get( '/api', ( req, res ) => {
    res.status( 200 ).json({
        message: 'API del Mesón La Paloma en marcha',
        data: null
    })
})

/* Si ninguna ruta coincide devolvemos 404, y recogemos todos los errores */
app.use( notFound )
app.use( errorHandler )

app.listen( PORT, () => {
    console.log( `API en http://localhost:${ PORT }/api` )
})
