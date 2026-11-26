
import { CONTACT } from '@const/business.js'
import { formatLongDate } from '@lib/format-date.js'
import { CancelBooking } from './cancel-booking.jsx'
import './manage-booking.css'

/* Pide a la API la reserva del código del enlace (GET /api/reservations/:token).
cache 'no-store': se pide en cada visita, porque la reserva puede cambiar o cancelarse.
encodeURIComponent: el código viene de la URL y se escribe tal cual en la dirección de la API.
Devuelve { reservation } si la encuentra, { notFound: true } si la API contesta 404
y { error: true } si no responde o contesta con otro error */
const getReservation = async code => {
    try {
        const res = await fetch( `${ process.env.API_URL }/reservations/${ encodeURIComponent( code ) }`, { cache: 'no-store' })

        if ( res.status === 404 ) return { notFound: true }
        if ( !res.ok ) return { error: true }

        const { data } = await res.json()

        return { reservation: data }
    } catch {
        return { error: true }
    }
}

/* El teléfono del mesón como enlace para llamar, en mostaza: se repite en todos los casos de la página */
const PhoneLink = () => (
    <a href={CONTACT.phoneHref} className="ManageBooking-link" title="Llamar al mesón">{CONTACT.phone}</a>
)

/* Página privada "Mi reserva": muestra los datos de una reserva a quien llega desde el enlace de su correo.
Sin código en la URL, o si la API no la encuentra, explica cómo llegar; si la API falla, da el teléfono */
export const ManageBooking = async ({ searchParams }) => {

    /* En Next, searchParams llega como una promesa: hay que esperarla para leer la URL */
    const { codigo } = await searchParams

    /* Sin código no hay nada que pedir: se trata igual que una reserva que no existe */
    const { reservation, notFound, error } = codigo ? await getReservation( codigo ) : { notFound: true }

    return (
        <>
            {/* En el hero de mi reserva, el título a dos tonos en una línea, contenido como en /reservar */}
            <section className="Container ManageBooking-hero">
                <h1 className="ManageBooking-title">
                    {/* El espacio separa las dos partes para los lectores de pantalla */}
                    Tu{' '}
                    <span className="ManageBooking-titleAccent">reserva</span>
                </h1>
            </section>
            {/* En la caja agrupamos lo que toca enseñar: la reserva, que no la encontramos o que la API no responde */}
            <section className="Container ManageBooking-content">
                <div className="ManageBooking-box">
                    { notFound && (
                        <>
                            <h2 className="ManageBooking-boxTitle">No encontramos tu reserva</h2>
                            <p className="ManageBooking-text">
                                Abre el enlace del correo de confirmación de tu reserva. Si no lo encuentras, llámanos al{' '}
                                <PhoneLink />.
                            </p>
                        </>
                    )}
                    { error && (
                        <p className="ManageBooking-text">
                            Ahora mismo no podemos mostrar tu reserva. Llámanos al{' '}
                            <PhoneLink />.
                        </p>
                    )}
                    { reservation && (
                        <>
                            {/* En los avisos agrupamos si la reserva está cancelada o si su día ya pasó */}
                            { reservation.status === 'cancelled' && (
                                <p className="ManageBooking-notice">Esta reserva está cancelada.</p>
                            )}
                            { reservation.isPast && (
                                <p className="ManageBooking-notice ManageBooking-notice--past">Esta reserva ya ha pasado. ¡Gracias por venir!</p>
                            )}
                            {/* En la lista agrupamos los datos de la reserva, cada uno en su línea */}
                            <ul className="ManageBooking-details">
                                <li className="ManageBooking-day">{formatLongDate( reservation.date )}</li>
                                <li className="ManageBooking-detail">{reservation.time}</li>
                                <li className="ManageBooking-detail">{`${ reservation.partySize } personas`}</li>
                                <li className="ManageBooking-detail">{`A nombre de ${ reservation.name }`}</li>
                                { reservation.notes && (
                                    <li className="ManageBooking-notes">{reservation.notes}</li>
                                )}
                            </ul>
                            {/* Si sigue en pie y aún no ha empezado, se puede cancelar desde aquí */}
                            { reservation.status === 'confirmed' && !reservation.isPast && (
                                <CancelBooking token={codigo} />
                            )}
                            <p className="ManageBooking-help">
                                ¿Necesitas algo? Llámanos al{' '}
                                <PhoneLink />.
                            </p>
                        </>
                    )}
                </div>
            </section>
        </>
    )
}
