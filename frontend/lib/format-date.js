
/* Escribe un día entero para leerlo: '2026-11-28' → 'sábado 28 de noviembre'.
La fecha se lee en UTC, igual que en la API, para que la zona horaria no cambie el día.
Intl lo daría como 'sábado, 28 de noviembre': con formatToParts juntamos las partes sin la coma */
export const formatLongDate = date => {
    const parts = new Intl.DateTimeFormat( 'es-ES', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
        .formatToParts( new Date( `${ date }T00:00:00Z` ) )
    const get = type => parts.find( part => part.type === type ).value

    return `${ get( 'weekday' ) } ${ get( 'day' ) } de ${ get( 'month' ) }`
}
