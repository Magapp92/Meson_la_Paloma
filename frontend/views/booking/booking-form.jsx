'use client'

import { useState } from 'react'
import { PARTY_SIZES } from '@const/booking.js'
import { CONTACT } from '@const/business.js'
import { useRequest } from '@hooks/use-request.js'

/* Las horas se reparten en comidas y cenas para leerlas mejor: las de antes de las 17:00 son comidas.
Las horas 'HH:MM' se pueden comparar como texto: '13:15' < '17:00' */
const SERVICES = Object.freeze([
    { title: 'Comidas', isInService: time => time < '17:00' },
    { title: 'Cenas', isInService: time => time >= '17:00' }
])

/* Formulario de reserva, por bloques numerados que se rellenan en orden: cada bloque aparece al completar el anterior.
Es un componente de cliente porque guarda lo que se va eligiendo (useState).
days: los días en los que se puede reservar, ya con su etiqueta ({ date, weekday, day, month }) */
export const BookingForm = ({ initialPartySize = null, days }) => {

    const [ partySize, setPartySize ] = useState( initialPartySize )
    const [ date, setDate ] = useState( null )
    const [ time, setTime ] = useState( null )

    /* Las horas libres se piden a la API cuando hay día y personas, y otra vez cada vez que cambia alguno */
    const availabilityPath = date && partySize ? `/availability?date=${ date }&partySize=${ partySize }` : null
    const { data: availability, error, isLoading } = useRequest( availabilityPath )

    /* Las horas de cada servicio; los servicios sin horas libres no se muestran */
    const services = SERVICES
        .map( service => ({ title: service.title, times: availability ? availability.times.filter( service.isInService ) : [] }) )
        .filter( service => service.times.length > 0 )

    /* Al cambiar las personas o el día, la hora elegida puede dejar de estar libre: se vuelve a elegir */
    const choosePartySize = size => {
        setPartySize( size )
        setTime( null )
    }
    const chooseDate = day => {
        setDate( day )
        setTime( null )
    }

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
                                onChange={ () => choosePartySize( size ) }
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
                                    onChange={ () => chooseDate( day.date ) }
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
            {/* En el bloque 3 agrupamos las horas libres de ese día, en comidas y cenas; aparece al elegir el día */}
            { partySize && date &&
                <fieldset className="BookingStep">
                    <legend className="BookingStep-title">
                        <span className="BookingStep-number">3</span>
                        ¿A qué hora?
                    </legend>
                    {/* Mientras llegan las horas, si hay un error o si no queda ninguna, un mensaje.
                    role="status" hace que el lector de pantalla lo lea en voz alta cuando cambia */}
                    <p className="BookingStep-status" role="status">
                        { isLoading && 'Buscando horas libres…' }
                        { error && `${ error }.` }
                        { availability && services.length === 0 &&
                            <>
                                Ese día ya no quedan mesas para {partySize}. Prueba otro día o{' '}
                                <a href={CONTACT.phoneHref} className="BookingStep-link">llámanos al {CONTACT.phone}</a>.
                            </>
                        }
                    </p>
                    { services.map( service =>
                        <div key={service.title} className="TimePicker">
                            <h3 className="TimePicker-title">{service.title}</h3>
                            <div className="TimePicker-times">
                                { service.times.map( serviceTime =>
                                    <label key={serviceTime} className="TimePicker-option">
                                        <input
                                            className="BookingForm-radio"
                                            type="radio"
                                            name="time"
                                            value={serviceTime}
                                            checked={time === serviceTime}
                                            onChange={ () => setTime( serviceTime ) }
                                        />
                                        <span className="TimePicker-time">{serviceTime}</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </fieldset>
            }
        </form>
    )
}
