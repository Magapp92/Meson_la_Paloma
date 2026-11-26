
import { Button } from '@components/button/button.jsx'
import { formatLongDate } from '@lib/format-date.js'
import './booking-review.css'

/* Escribe una reserva en una línea para comparar: 'sábado 28 de noviembre, a las 21:00, 4 personas' */
const toSummary = ({ date, time, partySize }) => `${ formatLongDate( date ) }, a las ${ time }, ${ partySize } personas`

/* Último paso al modificar una reserva: lo de antes y lo nuevo, y el botón para guardar.
Va dentro del formulario de BookingForm, que es quien envía el cambio al pulsar "Guardar cambios".
before y after: { partySize, date, time }; isUnchanged: si after es igual que before;
isSending: si se está guardando; sendError: el mensaje de la API si no se ha podido guardar */
export const BookingReview = ({ before, after, isUnchanged, isSending, sendError }) => {

    return (
        <div className="BookingReview">
            {/* En la lista agrupamos la reserva de antes y la nueva, cada una con su nombre delante */}
            <dl className="BookingReview-list">
                <div className="BookingReview-item">
                    <dt className="BookingReview-term">Antes:</dt>
                    <dd className="BookingReview-value">{toSummary( before )}</dd>
                </div>
                <div className="BookingReview-item BookingReview-item--new">
                    <dt className="BookingReview-term">Ahora:</dt>
                    <dd className="BookingReview-value">{toSummary( after )}</dd>
                </div>
            </dl>
            {/* Si no se ha cambiado nada, el botón queda apagado y esta nota explica por qué */}
            { isUnchanged &&
                <p className="BookingReview-note">No has cambiado nada.</p>
            }
            {/* Si la API no puede guardarlo, su mensaje. role="alert" hace que el lector de pantalla lo lea al aparecer */}
            { sendError &&
                <p className="BookingReview-error" role="alert">{sendError}</p>
            }
            <div className={`BookingReview-actions ${ isSending ? 'isSending' : '' }`}>
                <Button type="submit" disabled={isUnchanged || isSending}>{ isSending ? 'Guardando…' : 'Guardar cambios' }</Button>
            </div>
        </div>
    )
}
