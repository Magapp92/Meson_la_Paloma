'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@components/button/button.jsx'
import { PARTY_SIZES } from '@const/booking.js'
import { CONTACT, TIME_ZONE } from '@const/business.js'
import { ROUTES } from '@const/routes.js'
import { useRequest } from '@hooks/use-request.js'
import { request } from '@lib/request.js'
import { downloadCalendarEvent } from '@lib/calendar.js'

/* Los pasos del formulario, en orden. El número de cada paso es su posición + 1 */
const STEPS = Object.freeze([ 'Personas', 'Día', 'Hora', 'Datos' ])

/* Las horas se reparten en comidas y cenas para leerlas mejor: las de antes de las 17:00 son comidas.
Las horas 'HH:MM' se pueden comparar como texto: '13:15' < '17:00' */
const SERVICES = Object.freeze([
    { title: 'Comidas', isInService: time => time < '17:00' },
    { title: 'Cenas', isInService: time => time >= '17:00' }
])

/* Formulario de reserva por pasos, como un carrusel: se ve un paso cada vez y, al elegir, se desliza al siguiente.
Es un componente de cliente porque guarda lo que se va eligiendo (useState).
days: los días en los que se puede reservar, ya con su etiqueta ({ date, weekday, day, month, long }) */
export const BookingForm = ({ initialPartySize = null, days }) => {

    const [ partySize, setPartySize ] = useState( initialPartySize )
    const [ date, setDate ] = useState( null )
    const [ time, setTime ] = useState( null )

    /* Los datos de contacto, en un solo objeto: cada campo cambia su propiedad */
    const [ contact, setContact ] = useState({ name: '', phone: '', email: '', notes: '' })
    const [ isPrivacyAccepted, setIsPrivacyAccepted ] = useState( false )

    /* El envío: si se está enviando, el error de la API (400), el aviso si la hora se ha ocupado (409)
    y la reserva confirmada que devuelve la API */
    const [ isSending, setIsSending ] = useState( false )
    const [ sendError, setSendError ] = useState( '' )
    const [ notice, setNotice ] = useState( '' )
    const [ reservation, setReservation ] = useState( null )

    /* Paso actual (1, 2, 3…) y hacia dónde se ha movido, para deslizar desde la derecha o desde la izquierda.
    Si se llega con las personas elegidas (/reservar?personas=4), se empieza en el paso 2 */
    const [ step, setStep ] = useState( initialPartySize ? 2 : 1 )
    const [ direction, setDirection ] = useState( null )

    /* El paso que se ve, para llevarle el foco al cambiar */
    const stepRef = useRef( null )

    /* Las horas libres se piden a la API cuando hay día y personas, y otra vez cada vez que cambia alguno */
    const availabilityPath = date && partySize ? `/availability?date=${ date }&partySize=${ partySize }` : null
    const { data: availability, error, isLoading, reload } = useRequest( availabilityPath )

    /* Las horas de cada servicio; los servicios sin horas libres no se muestran */
    const services = SERVICES
        .map( service => ({ title: service.title, times: availability ? availability.times.filter( service.isInService ) : [] }) )
        .filter( service => service.times.length > 0 )

    /* Lo elegido en cada paso, para el resumen de arriba */
    const chosenDay = days.find( day => day.date === date )
    const chosen = [
        partySize && `${ partySize } personas`,
        chosenDay && `${ chosenDay.weekday } ${ chosenDay.day } ${ chosenDay.month }`,
        time,
        null
    ]

    /* Se puede ir a un paso si los anteriores están elegidos */
    const canGoTo = number => chosen.slice( 0, number - 1 ).every( Boolean )

    /* Al cambiar de paso, el foco pasa al paso nuevo: el teclado y el lector de pantalla siguen ahí.
    Al cargar la página (direction null) no se mueve */
    useEffect( () => {
        if ( direction ) stepRef.current?.focus()
    }, [ step, direction ] )

    /* Va a un paso, recordando si se avanza o se vuelve */
    const goTo = number => {
        setDirection( number > step ? 'forward' : 'back' )
        setStep( number )
    }

    /* Al elegir, se pasa al paso siguiente. Si cambian las personas o el día, la hora elegida
    puede dejar de estar libre: se vuelve a elegir */
    const choosePartySize = size => {
        setPartySize( size )
        setTime( null )
        setNotice( '' )
        goTo( 2 )
    }
    const chooseDate = day => {
        setDate( day )
        setTime( null )
        setNotice( '' )
        goTo( 3 )
    }
    const chooseTime = serviceTime => {
        setTime( serviceTime )
        setNotice( '' )
        goTo( 4 )
    }

    /* Cada campo de datos guarda su valor en la propiedad que se llama como su name.
    [ name ]: el nombre de la propiedad sale de una variable */
    const changeContact = event => {
        const { name, value } = event.target

        setContact({ ...contact, [ name ]: value })
    }

    /* Envía la reserva a la API. El navegador ya ha comprobado los campos obligatorios.
    - Si va bien, se guarda la reserva y se muestra el resumen.
    - 409: la hora se ha ocupado mientras se rellenaba. Se vuelve al paso 3 con las horas pedidas de nuevo.
    - Otro error: su mensaje encima del botón */
    const sendReservation = async event => {
        event.preventDefault()

        setIsSending( true )
        setSendError( '' )

        try {
            const data = await request( '/reservations', {
                method: 'POST',
                body: { date, time, partySize, ...contact }
            })

            setReservation( data )
        } catch ( error ) {
            if ( error.status === 409 ) {
                setNotice( error.message )
                setTime( null )
                reload()
                goTo( 3 )
            } else {
                setSendError( error.message )
            }
        } finally {
            setIsSending( false )
        }
    }

    /* Con la reserva hecha, en lugar del formulario se ve el resumen */
    if ( reservation ) {
        return <BookingConfirmation reservation={reservation} dayLabel={chosenDay.long} />
    }

    return (
        <form className="BookingForm" onSubmit={sendReservation}>
            {/* En el progreso agrupamos los pasos con lo elegido en cada uno; los ya hechos se pueden pulsar para volver */}
            <ol className="BookingProgress">
                { STEPS.map( ( name, index ) => {
                    const number = index + 1
                    const isCurrent = number === step
                    const label = chosen[ index ] || name

                    return (
                        <li key={name} className={`BookingProgress-step ${ isCurrent ? 'isCurrent' : '' } ${ chosen[ index ] ? 'isDone' : '' }`}>
                            { !isCurrent && canGoTo( number )
                                ? <button type="button" className="BookingProgress-button" onClick={ () => goTo( number ) } title={`Volver al paso ${ number }: ${ name }`}>
                                    <span className="BookingProgress-number">{number}</span>
                                    <span className="BookingProgress-label">{label}</span>
                                </button>
                                : <span className="BookingProgress-button" aria-current={ isCurrent ? 'step' : undefined }>
                                    <span className="BookingProgress-number">{number}</span>
                                    <span className="BookingProgress-label">{label}</span>
                                </span>
                            }
                        </li>
                    )
                })}
            </ol>
            {/* Solo se pinta el paso actual. key={step} hace que React lo cree de nuevo al cambiar,
            y así su animación de entrada se repite en cada paso */}
            <fieldset key={step} ref={stepRef} tabIndex={-1} className={`BookingStep ${ direction ? `BookingStep--${ direction }` : '' }`}>
                <legend className="BookingStep-title">
                    <span className="BookingStep-number">{step}</span>
                    { step === 1 && '¿Cuántos sois?' }
                    { step === 2 && '¿Qué día?' }
                    { step === 3 && '¿A qué hora?' }
                    { step === 4 && 'Tus datos' }
                </legend>
                {/* Paso 1: los círculos para elegir cuántas personas sois */}
                { step === 1 &&
                    <>
                        <div className="PartyPicker">
                            { PARTY_SIZES.map( size =>
                                <button
                                    key={size}
                                    type="button"
                                    className={`PartyPicker-circle ${ partySize === size ? 'isSelected' : '' }`}
                                    aria-pressed={partySize === size}
                                    onClick={ () => choosePartySize( size ) }
                                    title={`Reservar para ${ size } personas`}
                                >{size}</button>
                            )}
                        </div>
                        <p className="BookingStep-note">
                            ¿Sois más de 6? Las reservas de grupo se hacen por teléfono:{' '}
                            <a href={CONTACT.phoneHref} className="BookingStep-link">llámanos al {CONTACT.phone}</a>.
                        </p>
                    </>
                }
                {/* Paso 2: los días en los que se puede reservar */}
                { step === 2 &&
                    <div className="DayPicker">
                        { days.map( day =>
                            <button
                                key={day.date}
                                type="button"
                                className={`DayPicker-day ${ date === day.date ? 'isSelected' : '' }`}
                                aria-pressed={date === day.date}
                                onClick={ () => chooseDate( day.date ) }
                            >
                                <span className="DayPicker-weekday">{day.weekday}</span>
                                <span className="DayPicker-number">{day.day}</span>
                                <span className="DayPicker-month">{day.month}</span>
                            </button>
                        )}
                    </div>
                }
                {/* Paso 3: las horas libres de ese día, en comidas y cenas */}
                { step === 3 &&
                    <>
                        {/* Mientras llegan las horas, si hay un error o si no queda ninguna, un mensaje.
                        role="status" hace que el lector de pantalla lo lea en voz alta cuando cambia */}
                        <p className="BookingStep-status" role="status">
                            { notice && <strong className="BookingStep-notice">{notice}. </strong> }
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
                                        <button
                                            key={serviceTime}
                                            type="button"
                                            className={`TimePicker-time ${ time === serviceTime ? 'isSelected' : '' }`}
                                            aria-pressed={time === serviceTime}
                                            onClick={ () => chooseTime( serviceTime ) }
                                        >{serviceTime}</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                }
                {/* Paso 4: los datos de contacto y el botón para confirmar.
                Cada campo lleva su label (el lector de pantalla lo lee al entrar) y autoComplete,
                para que el navegador ofrezca rellenarlo con los datos que ya conoce */}
                { step === 4 &&
                    <div className="ContactFields">
                        <label className="ContactFields-field ContactFields-field--full">
                            <span className="ContactFields-label">Nombre</span>
                            <input className="ContactFields-input" type="text" name="name" value={contact.name} onChange={changeContact} autoComplete="name" required />
                        </label>
                        <label className="ContactFields-field">
                            <span className="ContactFields-label">Teléfono</span>
                            <input className="ContactFields-input" type="tel" name="phone" value={contact.phone} onChange={changeContact} autoComplete="tel" required />
                        </label>
                        <label className="ContactFields-field">
                            <span className="ContactFields-label">Correo</span>
                            <input className="ContactFields-input" type="email" name="email" value={contact.email} onChange={changeContact} autoComplete="email" required />
                        </label>
                        <label className="ContactFields-field ContactFields-field--full">
                            <span className="ContactFields-label">Notas <span className="ContactFields-optional">(opcional)</span></span>
                            <textarea className="ContactFields-input ContactFields-input--notes" name="notes" value={contact.notes} onChange={changeContact} maxLength={500} rows={3} placeholder="Una trona, una alergia, una celebración…" />
                        </label>
                        {/* La casilla de privacidad es obligatoria. El enlace se abre en otra pestaña para no perder lo escrito */}
                        <label className="ContactFields-consent ContactFields-field--full">
                            <input className="ContactFields-checkbox" type="checkbox" checked={isPrivacyAccepted} onChange={ event => setIsPrivacyAccepted( event.target.checked ) } required />
                            <span className="ContactFields-consentText">
                                He leído y acepto la{' '}
                                <Link href={ROUTES.HOME} target="_blank" rel="noopener" className="BookingStep-link">política de privacidad</Link>.
                            </span>
                        </label>
                        {/* Si la API rechaza algún dato, su mensaje. role="alert" hace que el lector de pantalla lo lea al aparecer */}
                        { sendError &&
                            <p className="ContactFields-error ContactFields-field--full" role="alert">{sendError}</p>
                        }
                        <div className="ContactFields-field--full">
                            <Button type="submit" disabled={isSending}>{ isSending ? 'Enviando…' : 'Confirmar reserva' }</Button>
                        </div>
                    </div>
                }
                {/* Desde el paso 2, un botón para volver al anterior */}
                { step > 1 &&
                    <button type="button" className="BookingStep-back" onClick={ () => goTo( step - 1 ) }>← Atrás</button>
                }
            </fieldset>
        </form>
    )
}

/* Resumen de la reserva confirmada, con los botones para guardarla en el calendario y ver la carta.
reservation: lo que devuelve la API ({ date, time, partySize, name, durationMinutes }); dayLabel: el día escrito entero */
const BookingConfirmation = ({ reservation, dayLabel }) => {

    /* Al aparecer, el foco va al título: el lector de pantalla lo lee y la página sube hasta él */
    const titleRef = useRef( null )

    useEffect( () => {
        titleRef.current?.focus()
    }, [] )

    /* Descarga el evento de calendario con los datos de la reserva */
    const addToCalendar = () => downloadCalendarEvent({
        title: `Mesa en Mesón La Paloma (${ reservation.partySize } personas)`,
        date: reservation.date,
        time: reservation.time,
        durationMinutes: reservation.durationMinutes,
        timeZone: TIME_ZONE,
        location: `${ CONTACT.street }, ${ CONTACT.city }`,
        fileName: 'reserva-meson-la-paloma.ics'
    })

    return (
        <section className="BookingConfirmation">
            <h2 ref={titleRef} tabIndex={-1} className="BookingConfirmation-title">Reserva confirmada</h2>
            <p className="BookingConfirmation-text">
                Te esperamos el <strong>{dayLabel}</strong> a las <strong>{reservation.time}</strong>.
                Mesa para {reservation.partySize} a nombre de {reservation.name}.
            </p>
            <p className="BookingConfirmation-note">
                Si necesitas cambiar algo,{' '}
                <a href={CONTACT.phoneHref} className="BookingStep-link">llámanos al {CONTACT.phone}</a>.
            </p>
            <div className="BookingConfirmation-actions">
                <Button onClick={addToCalendar}>Añadir al calendario</Button>
                <Button href={ROUTES.FOOD_MENU} variant="ghost" title="Ir a la carta">Ver la carta</Button>
            </div>
        </section>
    )
}
