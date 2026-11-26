
/* Ayudas para las respuestas de los controllers */

/* Respuesta de error con el formato de siempre: { message, data: null } */
const fail = ( res, status, message ) => res.status( status ).json({ message, data: null })

/* Exportamos las ayudas para los controllers */
module.exports = {
    fail
}
