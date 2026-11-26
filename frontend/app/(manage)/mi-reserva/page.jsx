
/* La ruta /mi-reserva muestra la vista ManageBooking. Se llega desde el enlace del correo de confirmación,
con el código de la reserva en la URL (/mi-reserva?codigo=…), por eso la página se genera en cada visita */
export { ManageBooking as default } from '@views/manage-booking/manage-booking.jsx'

/* Título de la pestaña ("Tu reserva · Mesón La Paloma") y descripción.
robots: es una página privada de cada cliente, así que Google no debe guardarla ni seguir sus enlaces */
export const metadata = {
    title: 'Tu reserva',
    description: 'Consulta los datos de tu reserva en el Mesón La Paloma.',
    robots: {
        index: false,
        follow: false
    }
}
