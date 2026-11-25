'use client'

import { useState } from 'react'
import { PARTY_SIZES } from '@const/booking.js'
import { CONTACT } from '@const/business.js'

/* Formulario de reserva, por bloques numerados que se rellenan en orden: cada bloque aparece al completar el anterior.
Es un componente de cliente porque guarda lo que se va eligiendo (useState).
days: los días en los que se puede reservar, ya con su etiqueta ({ date, weekday, day, month }) */
export const BookingForm = ({ initialPartySize = null, days }) => {

    const [ partySize, setPartySize ] = useState( initialPartySize )
    const [ date, setDate ] = useState( null )

    return (
        <form className="BookingForm" onSubmit={ event => event.preventDefault() }>
            {/* En el bloque 1 agrupamos los círculos para elegir cuántas personas sois */}
            <fieldset className="BookingStep">
                <legend className="BookingStep-title">
                    <span className="BookingStep-number">1</span>
                    ¿Cuántos sois?
                </legend>
                <div className="PartyPicker">
                    { PARTY_SIZES.map( size =>
                        <label key={size} className="PartyPicker-option">
                            {/* El radio de verdad está oculto: se ve el círculo, pero el teclado y los lectores de pantalla usan el radio */}
                            <input
                                className="BookingForm-radio"
                                type="radio"
                                name="partySize"
                                value={size}
                                checked={partySize === size}
                                onChange={ () => setPartySize( size ) }
                            />
                            <span className="PartyPicker-circle">{size}</span>
                        </label>
                    )}
                </div>
                <p className="BookingStep-note">
                    ¿Sois más de 6? Las reservas de grupo se hacen por teléfono:{' '}
                    <a href={CONTACT.phoneHref} className="BookingStep-link">llámanos al {CONTACT.phone}</a>.
                </p>
            </fieldset>
            {/* En el bloque 2 agrupamos los días en los que se puede reservar; aparece al elegir cuántos sois */}
            { partySize &&
                <fieldset className="BookingStep">
                    <legend className="BookingStep-title">
                        <span className="BookingStep-number">2</span>
                        ¿Qué día?
                    </legend>
                    <div className="DayPicker">
                        { days.map( day =>
                            <label key={day.date} className="DayPicker-option">
                                <input
                                    className="BookingForm-radio"
                                    type="radio"
                                    name="date"
                                    value={day.date}
                                    checked={date === day.date}
                                    onChange={ () => setDate( day.date ) }
                                />
                                <span className="DayPicker-day">
                                    <span className="DayPicker-weekday">{day.weekday}</span>
                                    <span className="DayPicker-number">{day.day}</span>
                                    <span className="DayPicker-month">{day.month}</span>
                                </span>
                            </label>
                        )}
                    </div>
                </fieldset>
            }
        </form>
    )
}
