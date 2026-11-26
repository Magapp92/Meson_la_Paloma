
/* Pide a la API los días en los que se puede reservar (GET /api/days). Se usa en el servidor,
en /reservar y en "Mi reserva".
cache 'no-store': se pide en cada visita, porque la lista cambia con el día y la hora.
Si la API no responde o contesta con error, devuelve null y la página muestra un aviso */
export const getDays = async () => {
    try {
        const res = await fetch( `${ process.env.API_URL }/days`, { cache: 'no-store' })

        if ( !res.ok ) return null

        const { data } = await res.json()

        return data.days
    } catch {
        return null
    }
}

/* Escribe un día '2026-11-25' por partes para el botón: { weekday: 'mié', day: '25', month: 'nov' },
y entero para el resumen final: 'miércoles 25 de noviembre'.
La fecha se lee en UTC, igual que en la API, para que la zona horaria no cambie el día */
export const toDayLabel = date => {
    const parsed = new Date( `${ date }T00:00:00Z` )
    const format = options => new Intl.DateTimeFormat( 'es-ES', { timeZone: 'UTC', ...options }).format( parsed ).replace( '.', '' )
    const day = format({ day: 'numeric' })

    return {
        date,
        weekday: format({ weekday: 'short' }),
        day,
        month: format({ month: 'short' }),
        long: `${ format({ weekday: 'long' }) } ${ day } de ${ format({ month: 'long' }) }`
    }
}
