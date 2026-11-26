
/* Avisos por correo que van después de guardar: la reserva ya está guardada y se mantiene aunque el correo no salga.
Cargamos el módulo entero (mailer) y no desestructuramos sendEmail: así la llamada busca mailer.sendEmail
en el momento de enviar, y en los tests usa el envío falso que pone test-helpers/fake-db.js */
const mailer = require( './mailer' )

/* Monta y envía un correo sin lanzar errores: si falla, solo lo apunta en la consola.
- buildMessage: una función que devuelve el correo. Se llama dentro del try, así si montar el correo falla
también se queda en la consola, como si hubiera fallado el envío.
- label: qué correo es, para el mensaje de la consola ('confirmación', 'cancelación'…) */
const sendEmailSafely = async ( buildMessage, label ) => {
    try {
        await mailer.sendEmail( buildMessage() )
    } catch ( error ) {
        console.error( `No se ha podido enviar el correo de ${ label }:`, error.message )
    }
}

/* Exportamos el envío seguro para el controller de reservas */
module.exports = {
    sendEmailSafely
}
