
import { useState, useEffect } from 'react'
import { request } from '@lib/request'

/* Hook que pide a la API una ruta (GET) y vuelve a pedirla cada vez que cambia, o al llamar a reload().
Si path es null no pide nada: por ejemplo, mientras no se ha elegido fecha */
export const useRequest = path => {

    /* Cada reload() suma uno a version. La petición se identifica por la ruta y la versión:
    si cambia cualquiera de las dos, se pide de nuevo */
    const [ version, setVersion ] = useState( 0 )
    const key = path === null ? null : `${ path }#${ version }`

    /* Guardamos la respuesta junto a la petición que la pidió */
    const [ result, setResult ] = useState({ key: null, data: null, error: '' })

    /* Está cargando si hay petición y su respuesta aún no ha llegado */
    const isLoading = key !== null && result.key !== key

    useEffect( () => {
        if ( key === null ) return

        /* Si la petición cambia antes de que llegue la respuesta, la antigua se descarta */
        let isCurrent = true

        request( path )
            .then( data => isCurrent && setResult({ key, data, error: '' }) )
            .catch( error => isCurrent && setResult({ key, data: null, error: error.message }) )

        return () => { isCurrent = false }
    }, [ path, key ] )

    /* Vuelve a pedir la misma ruta (por ejemplo, porque los datos han cambiado en la API) */
    const reload = () => setVersion( current => current + 1 )

    return {
        data: isLoading ? null : result.data,
        error: isLoading ? '' : result.error,
        isLoading,
        reload
    }
}
