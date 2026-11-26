/* Comprobación de la configuración al arrancar la API (lo llama index.js, después de leer el .env).
Sin estas variables la API arranca pero falla después, y de forma poco visible:
- sin MONGO_URI no hay carta ni reservas;
- sin BREVO_API_KEY o MAIL_FROM el cliente nunca recibe el correo con el código de su reserva;
- sin SITE_URL el enlace del correo sale "undefined/mi-reserva…" y CORS no deja entrar a la web.
Por eso en producción paramos el arranque; en desarrollo solo avisamos, para poder trabajar sin Brevo */
const REQUIRED_VARIABLES = [ 'MONGO_URI', 'BREVO_API_KEY', 'MAIL_FROM', 'SITE_URL' ]

/* Revisa las variables de env (por defecto, process.env) y las deja listas para usar.
- Quita la barra final de SITE_URL una sola vez aquí, para que el enlace del correo no salga con "//mi-reserva"
  y para que CORS compare bien con el origen del navegador (que nunca lleva barra).
- Si falta alguna: en producción lanza un error que nombra las que faltan; en desarrollo, un aviso por consola.
Nunca mostramos los valores: llevan contraseñas y claves.
Devuelve la lista de las que faltan */
const loadConfig = ( env = process.env ) => {
    if ( env.SITE_URL ) {
        env.SITE_URL = env.SITE_URL.trim().replace( /\/+$/, '' )
    }

    const missing = REQUIRED_VARIABLES.filter( name => !env[ name ] || !env[ name ].trim() )

    if ( missing.length === 0 ) return missing

    const message = `Faltan variables de entorno: ${ missing.join( ', ' ) }`

    if ( env.NODE_ENV === 'production' ) {
        throw new Error( `${ message }. La API no arranca sin ellas` )
    }

    console.warn( `Aviso: ${ message }. En desarrollo la API arranca igual, pero lo que dependa de ellas no funcionará` )

    return missing
}

module.exports = {
    REQUIRED_VARIABLES,
    loadConfig
}
