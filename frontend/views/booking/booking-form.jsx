'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@components/button/button.jsx'
import { PARTY_SIZES } from '@const/booking.js'
import { CONTACT } from '@const/business.js'
import { ROUTES } from '@const/routes.js'
import { useRequest } from '@hooks/use-request.js'
import { request } from '@lib/request.js'
import { toDayLabel } from '@lib/days.js'
import { BookingReview } from './booking-review.jsx'

/* Los pasos del formulario, en orden. El número de cada paso es su posición + 1 */
const STEPS = Object.freeze([ 'Personas', 'Día', 'Hora', 'Datos' ])

/* Al modificar una reserva los datos de contacto ya están: el último paso es revisar el cambio */
const EDIT_STEPS = Object.freeze([ 'Personas', 'Día', 'Hora', 'Revisar' ])

/* El mensaje de la API cuando la hora se ha ocupado (409). Otros 409 no son de la hora (al crear, que ya
tienes el máximo de reservas activas; al modificar, que está cancelada o ya ha empezado): solo con este
mensaje se vuelve a elegir hora; los demás se muestran encima del botón */
const TIME_TAKEN_MESSAGE = 'Esa hora ya no está libre. Elige otra, por favor'

/* Las horas se reparten en comidas y cenas para leerlas mejor: las de antes de las 17:00 son comidas.
Las horas 'HH:MM' se pueden comparar como texto: '13:15' < '17:00' */
const SERVICES = Object.freeze([
    { title: 'Comidas', isInService: time => time < '17:00' },
    { title: 'Cenas', isInService: time => time >= '17:00' }
])

/* Formulario de reserva por pasos, como un carrusel: se ve un paso cada vez y, al elegir, se desliza al siguiente.
Es un componente de cliente porque guarda lo que se va eligiendo (useState).
days: los días en los que se puede reservar, ya con su etiqueta ({ date, weekday, day, month, long }).
Modo edición ("Mi reserva"): con editToken se modifica esa reserva en lugar de crear una.
initial: lo que tiene ahora ({ partySize, date, time }), ya elegido al empezar; onDone: se llama al guardar, con { isSaved: true } */
export const BookingForm = ({ initialPartySize = null, days, editToken, initial, onDone }) => {

    const router = useRouter()

    /* Mientras la página se pide de nuevo tras guardar, el botón sigue en "Guardando…" */
    const [ isRefreshing, startRefresh ] = useTransition()

    const isEditing = Boolean( editToken )
    const steps = isEditing ? EDIT_STEPS : STEPS

    const [ partySize, setPartySize ] = useState( initial?.partySize ?? initialPartySize )
    const [ date, setDate ] = useState( initial?.date ?? null )
    const [ time, setTime ] = useState( initial?.time ?? null )

    /* Los datos de contacto, en un solo objeto: cada campo cambia su propiedad.
    website es el campo trampa para robots (ver el paso 4): una persona lo deja siempre vacío */
    const [ contact, setContact ] = useState({ name: '', phone: '', email: '', notes: '', website: '' })
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

    /* Las horas libres se piden a la API cuando hay día y personas, y otra vez cada vez que cambia alguno.
    Al modificar, exclude hace que la propia reserva no cuente como ocupada: su hora actual sale libre */
    const excludeQuery = isEditing ? `&exclude=${ encodeURIComponent( editToken ) }` : ''
    const availabilityPath = date && partySize ? `/availability?date=${ date }&partySize=${ partySize }${ excludeQuery }` : null
    const { data: availability, error, isLoading, reload } = useRequest( availabilityPath )

    /* Las horas de cada servicio; los servicios sin horas libres no se muestran */
    const services = SERVICES
        .map( service => ({ title: service.title, times: availability ? availability.times.filter( service.isInService ) : [] }) )
        .filter( service => service.times.length > 0 )

    /* Al modificar, la hora elegida se conserva al cambiar personas o día, pero solo vale si sigue libre.
    Mientras llegan las horas, se mantiene; cuando han llegado, si no está entre ellas no hay hora */
    const isTimeTaken = isEditing && Boolean( time ) && Boolean( availability ) && !availability.times.includes( time )
    const chosenTime = isTimeTaken ? null : time

    /* Lo elegido en cada paso, para el resumen de arriba.
    Al modificar, el día de la reserva podría no estar en la lista: entonces su etiqueta se escribe aquí */
    const chosenDay = days.find( day => day.date === date ) || ( date && toDayLabel( date ) )
    const chosen = [
        partySize && `${ partySize } personas`,
        chosenDay && `${ chosenDay.weekday } ${ chosenDay.day } ${ chosenDay.month }`,
        chosenTime,
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
    puede dejar de estar libre: al reservar se vuelve a elegir; al modificar se conserva marcada
    (chosenTime comprueba si sigue libre), para no perder de vista la hora de la reserva */
    const choosePartySize = size => {
        setPartySize( size )
        if ( !isEditing ) setTime( null )
        setNotice( '' )
        goTo( 2 )
    }
    const chooseDate = day => {
        setDate( day )
        if ( !isEditing ) setTime( null )
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

    /* Al modificar, si personas, día y hora son los de antes no hay nada que guardar */
    const isUnchanged = isEditing && partySize === initial.partySize && date === initial.date && chosenTime === initial.time

    /* Envía el formulario a la API. El navegador ya ha comprobado los campos obligatorios.
    - Al crear, si va bien, se guarda la reserva y se muestra el resumen.
    - Al modificar, si va bien, router.refresh() pide la página de nuevo al servidor (con los datos nuevos)
      y onDone() cierra el formulario. Van en una transición para que se cierre cuando ya han llegado.
    - 409 por hora ocupada: se ha ocupado mientras se elegía. Se vuelve al paso 3 con las horas pedidas de nuevo.
    - Otro error: su mensaje encima del botón */
    const sendForm = async event => {
        event.preventDefault()

        setIsSending( true )
        setSendError( '' )

        try {
            if ( isEditing ) {
                await request( `/reservations/${ encodeURIComponent( editToken ) }`, {
                    method: 'PATCH',
                    body: { date, time: chosenTime, partySize }
                })

                /* isSaved: true, para que "Mi reserva" sepa que se ha guardado y avise */
                startRefresh( () => {
                    router.refresh()
                    onDone({ isSaved: true })
                })
            } else {
                const data = await request( '/reservations', {
                    method: 'POST',
                    /* privacyAccepted: la casilla de privacidad; la API guarda cuándo se aceptó */
                    body: { date, time, partySize, ...contact, privacyAccepted: isPrivacyAccepted }
                })

                setReservation( data )
            }
        } catch ( error ) {
            if ( error.status === 409 && error.message === TIME_TAKEN_MESSAGE ) {
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
        <form className="BookingForm" onSubmit={sendForm}>
            {/* En el progreso agrupamos los pasos con lo elegido en cada uno; los ya hechos se pueden pulsar para volver */}
            <ol className="BookingProgress">
                { steps.map( ( name, index ) => {
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
                    { step === 4 && ( isEditing ? 'Revisa el cambio' : 'Tus datos' ) }
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
                            {/* Al modificar, si la hora de antes no está libre con las personas o el día nuevos */}
                            { isTimeTaken && <strong className="BookingStep-notice">Las {time} no están libres para esta opción. Elige otra hora. </strong> }
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
                                            className={`TimePicker-time ${ chosenTime === serviceTime ? 'isSelected' : '' }`}
                                            aria-pressed={chosenTime === serviceTime}
                                            onClick={ () => chooseTime( serviceTime ) }
                                        >{serviceTime}</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                }
                {/* Paso 4 al modificar: lo de antes y lo nuevo, y el botón para guardar */}
                { step === 4 && isEditing &&
                    <BookingReview
                        before={initial}
                        after={{ partySize, date, time: chosenTime }}
                        isUnchanged={isUnchanged}
                        isSending={isSending || isRefreshing}
                        sendError={sendError}
                    />
                }
                {/* Paso 4 al reservar: los datos de contacto y el botón para confirmar.
                Cada campo lleva su label (el lector de pantalla lo lee al entrar) y autoComplete,
                para que el navegador ofrezca rellenarlo con los datos que ya conoce.
                maxLength: los mismos máximos que acepta la API (nombre 80, teléfono 30, correo 254) */}
                { step === 4 && !isEditing &&
                    <div className="ContactFields">
                        <label className="ContactFields-field ContactFields-field--full">
                            <span className="ContactFields-label">Nombre</span>
                            <input className="ContactFields-input" type="text" name="name" value={contact.name} onChange={changeContact} autoComplete="name" maxLength={80} required />
                        </label>
                        <label className="ContactFields-field">
                            <span className="ContactFields-label">Teléfono</span>
                            <input className="ContactFields-input" type="tel" name="phone" value={contact.phone} onChange={changeContact} autoComplete="tel" maxLength={30} required />
                        </label>
                        <label className="ContactFields-field">
                            <span className="ContactFields-label">Correo</span>
                            <input className="ContactFields-input" type="email" name="email" value={contact.email} onChange={changeContact} autoComplete="email" maxLength={254} required />
                        </label>
                        <label className="ContactFields-field ContactFields-field--full">
                            <span className="ContactFields-label">Notas <span className="ContactFields-optional">(opcional)</span></span>
                            <textarea className="ContactFields-input ContactFields-input--notes" name="notes" value={contact.notes} onChange={changeContact} maxLength={500} rows={3} placeholder="Una trona, una alergia, una celebración…" aria-describedby="notes-hint" />
                            {/* Aviso de privacidad: las alergias sí, otros datos de salud no. aria-describedby hace que
                            el lector de pantalla lo lea al entrar en el campo */}
                            <span id="notes-hint" className="ContactFields-hint">Si tienes alguna alergia o intolerancia, indícala aquí. No escribas otros datos de salud.</span>
                        </label>
                        {/* Campo trampa para robots: está en la página pero nadie lo ve. Fuera de la vista (CSS),
                        oculto al lector de pantalla (aria-hidden), sin paso con el tabulador (tabIndex -1) y sin que
                        el navegador lo rellene solo (autoComplete off). Una persona lo deja vacío; un robot que rellena
                        todos los campos lo escribe, y la API descarta esa reserva sin decírselo.
                        No usamos display: none porque muchos robots se saltan los campos ocultos así */}
                        <div className="ContactFields-trap" aria-hidden="true">
                            <label>
                                Web
                                <input type="text" name="website" value={contact.website} onChange={changeContact} tabIndex={-1} autoComplete="off" />
                            </label>
                        </div>
                        {/* La casilla de privacidad es obligatoria. El enlace se abre en otra pestaña para no perder lo escrito */}
                        <label className="ContactFields-consent ContactFields-field--full">
                            <input className="ContactFields-checkbox" type="checkbox" checked={isPrivacyAccepted} onChange={ event => setIsPrivacyAccepted( event.target.checked ) } required />
                            <span className="ContactFields-consentText">
                                He leído y acepto la{' '}
                                <Link href={ROUTES.PRIVACY} target="_blank" rel="noopener" className="BookingStep-link">política de privacidad</Link>.
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

/* Resumen de la reserva confirmada, con la nota del correo y el botón para ver la carta.
reservation: lo que devuelve la API ({ date, time, partySize, name }); dayLabel: el día escrito entero */
const BookingConfirmation = ({ reservation, dayLabel }) => {

    /* Al aparecer, el foco va al título: el lector de pantalla lo lee y la página sube hasta él */
    const titleRef = useRef( null )

    useEffect( () => {
        titleRef.current?.focus()
    }, [] )

    return (
        <section className="BookingConfirmation">
            <h2 ref={titleRef} tabIndex={-1} className="BookingConfirmation-title">Reserva confirmada</h2>
            <p className="BookingConfirmation-text">
                Te esperamos el <strong>{dayLabel}</strong> a las <strong>{reservation.time}</strong>.
                Mesa para {reservation.partySize} a nombre de {reservation.name}.
            </p>
            {/* El calendario se gestiona con la invitación del correo, no con botones aquí: un evento creado
            desde la página no se podría actualizar al cambiar o cancelar la reserva y quedaría duplicado */}
            <p className="BookingConfirmation-note">
                Te hemos enviado un correo con los datos y la invitación de calendario: añádela desde allí
                y se actualizará sola si cambias o cancelas la reserva.
            </p>
            <p className="BookingConfirmation-note">
                Si necesitas cambiar algo,{' '}
                <a href={CONTACT.phoneHref} className="BookingStep-link">llámanos al {CONTACT.phone}</a>.
            </p>
            {/* El enlace a la carta */}
            <div className="BookingConfirmation-actions">
                <Button href={ROUTES.FOOD_MENU} variant="ghost" title="Ir a la carta">Ver la carta</Button>
            </div>
        </section>
    )
}
