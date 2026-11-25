
import { useState, useEffect } from 'react'
import { request } from '@lib/request'

/* Hook que pide a la API una ruta (GET) y vuelve a pedirla cada vez que cambia.
Si path es null no pide nada: por ejemplo, mientras no se ha elegido fecha */
export const useRequest = path => {

    /* Guardamos la respuesta junto a la ruta que la pidió */
    const [ result, setResult ] = useState({ path: null, data: null, error: '' })

    /* Está cargando si hay ruta y su respuesta aún no ha llegado */
    const isLoading = path !== null && result.path !== path

    useEffect( () => {
        if ( path === null ) return

        /* Si la ruta cambia antes de que llegue la respuesta, la antigua se descarta */
        let isCurrent = true

        request( path )
            .then( data => isCurrent && setResult({ path, data, error: '' }) )
            .catch( error => isCurrent && setResult({ path, data: null, error: error.message }) )

        return () => { isCurrent = false }
    }, [ path ] )

    return {
        data: isLoading ? null : result.data,
        error: isLoading ? '' : result.error,
        isLoading
    }
}
