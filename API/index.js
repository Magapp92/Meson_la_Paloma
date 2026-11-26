/* Arranque de la API del Mesón La Paloma: lee y comprueba la configuración, conecta con Mongo y abre el puerto.
La app (middlewares, rutas y errores) está en app.js, separada de aquí para poder probarla sin arrancar el servidor */
console.log( 'Iniciando la API del Mesón La Paloma' )

/* Leemos las variables del .env y las comprobamos ANTES de cargar la app: app.js usa SITE_URL para CORS,
y loadConfig la deja ya sin barra final. En producción, si falta alguna, paramos aquí con un mensaje claro */
require( 'dotenv' ).config({ quiet: true })
const { loadConfig } = require( './config/env' )

try {
    loadConfig()
} catch ( error ) {
    console.error( error.message )
    process.exit( 1 )
}

const { app } = require( './app' )
const { connect } = require( './config/db' )

const { PORT = 4000 } = process.env

/* Conectamos al arrancar para ver en la consola si Mongo responde (sin mostrar la cadena de conexión) */
connect()
    .then( () => console.log( 'Conectado a MongoDB' ) )
    .catch( error => console.log( `Sin conexión a MongoDB: ${ error.message }` ) )

/* En Express 5 el callback de listen recibe el error si no se puede abrir el puerto (por ejemplo, porque ya está ocupado).
Sin esto la API se quedaría "arrancada" sin escuchar; así lo vemos en la consola y el proceso termina */
app.listen( PORT, error => {
    if ( error ) {
        console.error( `No se ha podido arrancar la API en el puerto ${ PORT }: ${ error.message }` )
        process.exit( 1 )
    }

    console.log( `API en http://localhost:${ PORT }/api` )
})
