
/* Avisos por correo que van después de guardar: la reserva ya está guardada y se mantiene aunque el correo no salga.
Cargamos el módulo entero (mailer) y no desestructuramos sendEmail: así la llamada busca mailer.sendEmail
en el momento de enviar, y en los tests usa el envío falso que pone test-helpers/fake-db.js */
const mailer = require( './mailer' )

/* El texto que se añade al mensaje de la consola para saber de qué reserva era el correo.
Con un objeto solo cogemos _id, fecha y hora: aunque llegue la reserva entera, el nombre, el teléfono
y el correo del cliente no acaban en los registros del servidor */
const describeContext = context => {
    if ( !context ) return ''
    if ( typeof context === 'string' ) return ` (${ context })`

    return ` (reserva ${ context._id }, ${ context.date } ${ context.time })`
}

/* Monta y envía un correo sin lanzar errores: si falla, solo lo apunta en la consola.
- buildMessage: una función que devuelve el correo. Se llama dentro del try, así si montar el correo falla
también se queda en la consola, como si hubiera fallado el envío.
- label: qué correo es, para el mensaje de la consola ('confirmación', 'cancelación'…).
- context (opcional): un texto o un objeto con _id, fecha y hora de la reserva, para el mensaje de la consola.
Devuelve true si se ha enviado y false si ha fallado, para que quien llama pueda apuntar el fallo en la reserva */
const sendEmailSafely = async ( buildMessage, label, context ) => {
    try {
        await mailer.sendEmail( buildMessage() )

        return true
    } catch ( error ) {
        console.error( `No se ha podido enviar el correo de ${ label }${ describeContext( context ) }:`, error.message )

        return false
    }
}

/* Exportamos el envío seguro para el controller de reservas */
module.exports = {
    sendEmailSafely
}
