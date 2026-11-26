
/* Creamos un error 404 cuando el endpoint no existe */
const notFound = ( req, res, next ) => {
    const error = new Error( `Endpoint no existe: ${ req.method } ${ req.originalUrl }` )
    error.status = 404
    next( error )
}

/* Mensaje para los errores inesperados: nunca enseñamos el error real al cliente,
porque puede contar cosas internas (nombres de la base de datos, rutas, librerías…) */
const SERVER_ERROR_MESSAGE = 'Ha habido un error en el servidor. Inténtalo de nuevo o llámanos'

/* Recogemos cualquier error y respondemos siempre con { message, data }.
- Si el id no tiene formato de Mongo, 400 (sin repetir el valor recibido).
- Si express.json no puede leer el cuerpo: 400 si el JSON está mal escrito y 413 si pasa de 10 kb.
- Los errores que ya traen un status de cliente (menor que 500, como el 404 de notFound) se responden tal cual.
- Cualquier otro es inesperado: 500 con un mensaje genérico, y el error real solo a la consola */
const errorHandler = ( error, req, res, next ) => {
    if ( error.name === 'CastError' ) {
        return res.status( 400 ).json({ message: 'Id no válido', data: null })
    }

    if ( error.type === 'entity.parse.failed' ) {
        return res.status( 400 ).json({ message: 'Los datos enviados no son un JSON válido', data: null })
    }

    if ( error.type === 'entity.too.large' ) {
        return res.status( 413 ).json({ message: 'Los datos enviados son demasiado grandes', data: null })
    }

    if ( Number.isInteger( error.status ) && error.status >= 400 && error.status < 500 ) {
        return res.status( error.status ).json({ message: error.message, data: null })
    }

    console.error( error )
    res.status( 500 ).json({ message: SERVER_ERROR_MESSAGE, data: null })
}

module.exports = {
    notFound,
    errorHandler
}
