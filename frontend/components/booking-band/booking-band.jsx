
import { PartySizes } from '@components/party-sizes/party-sizes.jsx'
import { CONTACT } from '@const/business.js'
import './booking-band.css'

/* Franja mostaza para reservar que va al final de las páginas interiores (todas menos la portada y Mi reserva),
para que la opción de reservar se vea siempre. Lleva la invitación, el aviso de los grupos y los círculos */
export const BookingBand = () => {

    return (
        <section className="BookingBand">
            <div className="Container BookingBand-inner">
                <div className="BookingBand-content">
                    <h2 className="BookingBand-title">Reserva tu mesa ahora</h2>
                    <p className="BookingBand-text">Elige cuántos sois y reserva tu mesa. Si sois más de 6, es una reserva de grupo: llámanos al {CONTACT.phone}.</p>
                </div>
                <PartySizes onAccent />
            </div>
        </section>
    )
}
