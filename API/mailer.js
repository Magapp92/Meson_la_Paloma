
/* Envío de correos con la API transaccional de Brevo.
Usa el fetch que trae Node, así no hace falta instalar ningún paquete.
La clave y el remitente salen de las variables de entorno: BREVO_API_KEY, MAIL_FROM y MAIL_FROM_NAME */
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

/* Envía un correo.
- to: el destinatario, como { email, name }.
- subject, html y text: el asunto y el cuerpo en HTML y en texto plano.
Si falta la clave o el remitente no envía nada y devuelve null: así se puede trabajar en local sin clave.
Si Brevo responde con error, lanza un Error con su mensaje. Si va bien, devuelve la respuesta de Brevo (trae messageId) */
const sendEmail = async ({ to, subject, html, text }) => {
    const apiKey = process.env.BREVO_API_KEY
    const fromEmail = process.env.MAIL_FROM
    const fromName = process.env.MAIL_FROM_NAME || 'Mesón La Paloma'

    if ( !apiKey || !fromEmail ) {
        console.warn( 'Correo no enviado: faltan BREVO_API_KEY o MAIL_FROM en el entorno' )
        return null
    }

    const res = await fetch( BREVO_URL, {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [ { email: to.email, name: to.name } ],
            subject,
            htmlContent: html,
            textContent: text
        })
    })

    /* Brevo devuelve JSON también en los errores; si no se puede leer, seguimos con un objeto vacío */
    const body = await res.json().catch( () => ({}) )

    if ( !res.ok ) {
        throw new Error( `Brevo no pudo enviar el correo (${ res.status }): ${ body.message || 'error desconocido' }` )
    }

    return body
}

/* Exportamos el envío para los controllers */
module.exports = {
    sendEmail
}
