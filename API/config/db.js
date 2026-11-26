/* Conexión a MongoDB Atlas. Lo usan la API (app.js e index.js) y el script que carga la carta (seed.js) */
const mongoose = require( 'mongoose' )

/* Leemos la cadena de conexión del .env. Nunca la mostramos en la consola: lleva la contraseña */
require( 'dotenv' ).config({ quiet: true })
const { MONGO_URI } = process.env

/* Avisamos en la consola si la conexión se cae después de arrancar y cuando vuelve.
Mongoose intenta reconectar solo; mientras tanto, las peticiones que usan la base responden 503 (app.js) */
mongoose.connection.on( 'disconnected', () => console.log( 'Se ha perdido la conexión con MongoDB' ) )
mongoose.connection.on( 'reconnected', () => console.log( 'Conexión con MongoDB recuperada' ) )

/* Guardamos la conexión para no abrir una nueva en cada petición.
Si falla la dejamos a null y se vuelve a intentar en la siguiente */
let connection = null

const connect = () => {
    if ( !MONGO_URI ) {
        return Promise.reject( new Error( 'Falta MONGO_URI en el archivo .env' ) )
    }

    if ( !connection ) {
        connection = mongoose.connect( MONGO_URI, { serverSelectionTimeoutMS: 5000 })
            .catch( error => {
                connection = null
                throw error
            })
    }

    return connection
}

/* ¿Está la conexión abierta ahora mismo? readyState 1 es "conectado".
Hace falta además de connect(): si la conexión se perdió después de arrancar, connect() ya se cumplió
y no vuelve a fallar, pero las consultas se quedarían esperando hasta dar error */
const isConnected = () => mongoose.connection.readyState === 1

module.exports = {
    connect,
    isConnected
}
