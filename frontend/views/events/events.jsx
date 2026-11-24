
import { BookingBand } from '@components/booking-band/booking-band.jsx'
import { Button } from '@components/button/button.jsx'
import { CONTACT } from '@const/business.js'
import './events.css'

/* Tipos de celebración que se pueden organizar en el mesón, con un texto corto cada uno */
const EVENT_TYPES = Object.freeze([
    { title: 'Cumpleaños', text: 'Celebra tu día con la familia y los amigos, alrededor de una buena mesa.' },
    { title: 'Comidas de empresa', text: 'Comidas y cenas con tu equipo, para un día cualquiera o para cerrar el año.' },
    { title: 'Grupos y reuniones', text: 'Quedadas de amigos, peñas o mesas de más de 6 personas.' },
    { title: 'Comidas y cenas de Navidad', text: 'Las fechas más especiales del año, con los tuyos. Reserva con tiempo.' }
])

/* Página de menús y eventos: los tipos de celebración y cómo pedir presupuesto.
Los menús cerrados con precio se añadirán cuando el mesón los tenga */
export const Events = () => {

    return (
        <main>
            {/* En el hero de menús y eventos agrupamos el título a dos tonos y una entradilla */}
            <section className="Container EventsPage-hero">
                <h1 className="EventsPage-title">
                    {/* El espacio separa las dos partes para los lectores de pantalla */}
                    Menús{' '}
                    <span className="EventsPage-titleAccent">y eventos</span>
                </h1>
                <p className="EventsPage-intro">¿Tienes algo que celebrar? Cuéntanos qué necesitas y lo organizamos contigo.</p>
            </section>
            {/* En los tipos de celebración agrupamos una tarjeta por cada uno, numerada */}
            <section className="Container EventTypes">
                <ul className="EventTypes-list">
                    { EVENT_TYPES.map( ( eventType, index ) =>
                        <li key={eventType.title} className="EventTypes-item">
                            {/* El número va con dos cifras (01, 02…) y lo ocultamos a los lectores de pantalla:
                            solo es decoración */}
                            <span className="EventTypes-number" aria-hidden="true">{String( index + 1 ).padStart( 2, '0' )}</span>
                            <h2 className="EventTypes-title">{eventType.title}</h2>
                            <p className="EventTypes-text">{eventType.text}</p>
                        </li>
                    )}
                </ul>
            </section>
            {/* En el presupuesto agrupamos la invitación a contactar y los botones para llamar o escribir */}
            <section className="Container Quote">
                <div className="Quote-box">
                    <h2 className="Quote-title">Pide tu presupuesto</h2>
                    <p className="Quote-text">Dinos la fecha, cuántos seréis y qué te apetece, y te preparamos una propuesta. Las reservas de grupo se hacen por teléfono.</p>
                    <div className="Quote-actions">
                        <Button href={CONTACT.phoneHref} title="Llamar al mesón">Llamar al {CONTACT.phone}</Button>
                        <Button href={`mailto:${ CONTACT.email }`} variant="ghost" title="Escribir un correo al mesón">Escribir un correo</Button>
                    </div>
                </div>
            </section>
            <BookingBand />
        </main>
    )
}
