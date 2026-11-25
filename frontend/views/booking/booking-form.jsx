'use client'

import { useState } from 'react'
import { PARTY_SIZES } from '@const/booking.js'
import { CONTACT } from '@const/business.js'

/* Formulario de reserva, por bloques numerados que se rellenan en orden.
Es un componente de cliente porque guarda lo que se va eligiendo (useState) */
export const BookingForm = ({ initialPartySize = null }) => {

    const [ partySize, setPartySize ] = useState( initialPartySize )

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
                                className="PartyPicker-input"
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
        </form>
    )
}
