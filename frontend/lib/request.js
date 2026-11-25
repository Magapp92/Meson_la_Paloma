
/* Todas las peticiones del navegador a la API pasan por aquí.
Si la respuesta no es ok, lanzamos el mensaje que manda la API para que la página pueda mostrarlo */
export const request = async ( path, { body, ...options } = {} ) => {

    /* Si hay cuerpo, lo mandamos como JSON */
    if ( body !== undefined ) {
        options.body = JSON.stringify( body )
        options.headers = { ...options.headers, 'Content-Type': 'application/json' }
    }

    let response

    try {
        response = await fetch( `${ process.env.NEXT_PUBLIC_API_URL }${ path }`, options )
    } catch {
        throw new Error( 'No hemos podido conectar. Revisa tu conexión o llámanos' )
    }

    /* Leemos el cuerpo; si no es JSON (por ejemplo, un error del servidor) seguimos sin romper */
    const { message, data } = await response.json().catch( () => ({}) )

    if ( !response.ok ) {
        throw new Error( message || 'Algo ha fallado. Inténtalo de nuevo o llámanos' )
    }

    return data
}
