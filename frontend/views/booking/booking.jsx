
import { PARTY_SIZES } from '@const/booking.js'
import { CONTACT } from '@const/business.js'
import { getDays, toDayLabel } from '@lib/days.js'
import { BookingForm } from './booking-form.jsx'
import './booking.css'

/* Página para reservar mesa: el título y el formulario.
Si se llega desde un círculo (/reservar?personas=4), el formulario empieza con ese número elegido */
export const Booking = async ({ searchParams }) => {

    /* En Next, searchParams llega como una promesa: hay que esperarla para leer la URL */
    const { personas } = await searchParams

    /* Solo se acepta si es uno de los números que se ofrecen; si no, el formulario empieza sin elegir */
    const initialPartySize = PARTY_SIZES.includes( Number( personas ) ) ? Number( personas ) : null

    /* Los días con sus etiquetas ya escritas: el formulario solo tiene que pintarlas */
    const days = await getDays()
    const dayLabels = days ? days.map( toDayLabel ) : null

    return (
        <main>
            {/* En el hero de reservar, el título a dos tonos en una línea: más pequeño que en otras páginas
            para que el formulario quepa en la pantalla sin bajar */}
            <section className="Container BookingPage-hero">
                <h1 className="BookingPage-title">
                    Reserva <span className="BookingPage-titleAccent">tu mesa</span>
                </h1>
            </section>
            {/* En el formulario agrupamos los pasos de la reserva; si la API no responde, un aviso con el teléfono */}
            <section className="Container BookingPage-form">
                { dayLabels
                    ? <BookingForm initialPartySize={initialPartySize} days={dayLabels} />
                    : <p className="BookingPage-error">
                        Ahora mismo no podemos mostrar las reservas. Llámanos al{' '}
                        <a href={CONTACT.phoneHref} className="BookingPage-errorLink" title="Llamar al mesón">{CONTACT.phone}</a>
                        {' '}y te reservamos la mesa.
                    </p>
                }
            </section>
        </main>
    )
}
