
/* Conexión a MongoDB Atlas. Lo usan la API (index.js) y el script que carga la carta (seed.js) */
const mongoose = require( 'mongoose' )

/* Leemos la cadena de conexión del .env. Nunca la mostramos en la consola: lleva la contraseña */
require( 'dotenv' ).config({ quiet: true })
const { MONGO_URI } = process.env

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

module.exports = {
    connect
}
