
import { PARTY_SIZES } from '@const/booking.js'
import { BookingForm } from './booking-form.jsx'
import './booking.css'

/* Página para reservar mesa: el título y el formulario.
Si se llega desde un círculo (/reservar?personas=4), el formulario empieza con ese número elegido */
export const Booking = async ({ searchParams }) => {

    /* En Next, searchParams llega como una promesa: hay que esperarla para leer la URL */
    const { personas } = await searchParams

    /* Solo se acepta si es uno de los números que se ofrecen; si no, el formulario empieza sin elegir */
    const initialPartySize = PARTY_SIZES.includes( Number( personas ) ) ? Number( personas ) : null

    return (
        <main>
            {/* En el hero de reservar agrupamos el título a dos tonos y una entradilla */}
            <section className="Container BookingPage-hero">
                <h1 className="BookingPage-title">
                    {/* El espacio separa las dos partes para los lectores de pantalla */}
                    Reserva{' '}
                    <span className="BookingPage-titleAccent">tu mesa</span>
                </h1>
                <p className="BookingPage-intro">Elige cuántos sois, el día y la hora. Te confirmamos la mesa al momento.</p>
            </section>
            {/* En el formulario agrupamos los pasos de la reserva */}
            <section className="Container BookingPage-form">
                <BookingForm initialPartySize={initialPartySize} />
            </section>
        </main>
    )
}
