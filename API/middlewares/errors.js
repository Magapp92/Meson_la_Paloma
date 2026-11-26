/* Creamos un error 404 cuando el endpoint no existe. El mensaje es fijo: no repetimos la URL recibida */
const notFound = ( req, res, next ) => {
    const error = new Error( 'Esta dirección no existe en la API' )
    error.status = 404
    next( error )
}

/* Mensaje para los errores inesperados: nunca enseñamos el error real al cliente,
porque puede contar cosas internas (nombres de la base de datos, rutas, librerías…) */
const SERVER_ERROR_MESSAGE = 'Ha habido un error en el servidor. Inténtalo de nuevo o llámanos'

/* Mensaje cuando MongoDB no responde (lo usa también app.js) */
const SERVICE_UNAVAILABLE_MESSAGE = 'El servicio no está disponible ahora mismo. Inténtalo en unos minutos o llámanos'

/* Mensajes fijos para los errores de cliente (4xx) que vienen de librerías (express.json, Express…).
No respondemos su mensaje porque a veces repite lo que mandó el cliente (por ejemplo, el charset en un 415) */
const CLIENT_ERROR_MESSAGES = {
    400: 'La petición no es válida',
    404: 'Esta dirección no existe en la API',
    405: 'Este método no está permitido en esta dirección',
    413: 'Los datos enviados son demasiado grandes',
    415: 'El formato de los datos enviados no es válido'
}
const DEFAULT_CLIENT_ERROR_MESSAGE = 'No se ha podido atender la petición'

/* Errores que significan "no hay conexión con MongoDB": no es un fallo nuestro, es que la base no responde.
El de "buffering timed out" lo da Mongoose cuando una consulta espera a una conexión que no llega */
const MONGO_CONNECTION_ERRORS = [ 'MongoServerSelectionError', 'MongoNetworkError', 'MongooseServerSelectionError' ]
const isMongoUnavailable = error => MONGO_CONNECTION_ERRORS.includes( error.name ) || /buffering timed out/i.test( error.message || '' )

/* En la consola tapamos el código secreto de las rutas de "Mi reserva": con él se puede leer y cambiar la reserva */
const safePath = path => path.replace( /^\/api\/reservations\/[^/]+/, '/api/reservations/:token' )

/* Recogemos cualquier error y respondemos siempre con { message, data }.
- Si express.json no puede leer el cuerpo: 400 si el JSON está mal escrito y 413 si pasa de 10 kb.
- Si MongoDB no responde: 503, para que el cliente sepa que es temporal.
- Los errores que ya traen un status de cliente (menor que 500, como el 404 de notFound) se responden
  con su código y un mensaje fijo según el código.
- Cualquier otro es inesperado: 500 con un mensaje genérico. En la consola solo el nombre, el mensaje,
  el método y la ruta: ni el body ni el error completo, que pueden llevar datos personales */
const errorHandler = ( error, req, res, next ) => {
    if ( error.type === 'entity.parse.failed' ) {
        return res.status( 400 ).json({ message: 'Los datos enviados no son un JSON válido', data: null })
    }

    if ( error.type === 'entity.too.large' ) {
        return res.status( 413 ).json({ message: 'Los datos enviados son demasiado grandes', data: null })
    }

    if ( isMongoUnavailable( error ) ) {
        console.log( `Sin conexión a MongoDB: ${ error.name }` )
        return res.status( 503 ).json({ message: SERVICE_UNAVAILABLE_MESSAGE, data: null })
    }

    if ( Number.isInteger( error.status ) && error.status >= 400 && error.status < 500 ) {
        const message = CLIENT_ERROR_MESSAGES[ error.status ] || DEFAULT_CLIENT_ERROR_MESSAGE
        return res.status( error.status ).json({ message, data: null })
    }

    console.error( 'Error inesperado:', {
        name: error.name,
        message: error.message,
        method: req.method,
        path: safePath( req.path )
    })
    res.status( 500 ).json({ message: SERVER_ERROR_MESSAGE, data: null })
}

module.exports = {
    notFound,
    errorHandler,
    SERVICE_UNAVAILABLE_MESSAGE
}
