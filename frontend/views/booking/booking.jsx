
import { PARTY_SIZES } from '@const/booking.js'
import { CONTACT } from '@const/business.js'
import { BookingForm } from './booking-form.jsx'
import './booking.css'

/* Pide a la API los días en los que se puede reservar (GET /api/days).
cache 'no-store': se pide en cada visita, porque la lista cambia con el día y la hora.
Si la API no responde o contesta con error, devuelve null y la página muestra un aviso */
const getDays = async () => {
    try {
        const res = await fetch( `${ process.env.API_URL }/days`, { cache: 'no-store' })

        if ( !res.ok ) return null

        const { data } = await res.json()

        return data.days
    } catch {
        return null
    }
}

/* Escribe un día '2026-11-25' por partes para el botón: { weekday: 'mié', day: '25', month: 'nov' }.
La fecha se lee en UTC, igual que en la API, para que la zona horaria no cambie el día */
const toDayLabel = date => {
    const parsed = new Date( `${ date }T00:00:00Z` )
    const format = options => new Intl.DateTimeFormat( 'es-ES', { timeZone: 'UTC', ...options }).format( parsed ).replace( '.', '' )

    return {
        date,
        weekday: format({ weekday: 'short' }),
        day: format({ day: 'numeric' }),
        month: format({ month: 'short' })
    }
}

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
            {/* En el hero de reservar agrupamos el título a dos tonos y una entradilla */}
            <section className="Container BookingPage-hero">
                <h1 className="BookingPage-title">
                    {/* El espacio separa las dos partes para los lectores de pantalla */}
                    Reserva{' '}
                    <span className="BookingPage-titleAccent">tu mesa</span>
                </h1>
                <p className="BookingPage-intro">Elige cuántos sois, el día y la hora. Te confirmamos la mesa al momento.</p>
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
