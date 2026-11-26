'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@components/button/button.jsx'
import { BookingForm } from '@views/booking/booking-form.jsx'
import '@views/booking/booking.css'
import './edit-booking.css'

/* Botón para modificar la reserva desde "Mi reserva": al pulsarlo se abre el mismo formulario por pasos de /reservar,
ya con las personas, el día y la hora de la reserva elegidos.
Es un componente de cliente porque guarda si el formulario está abierto (useState).
token: el código de la reserva; reservation: la reserva que devuelve la API; days: los días con su etiqueta.
children: el botón de cancelar, que va en la misma fila y se oculta mientras se modifica */
export const EditBooking = ({ token, reservation, days, children }) => {

    const [ isEditing, setIsEditing ] = useState( false )

    /* El formulario y el botón de abrirlo, para llevarles el foco al abrir y al cerrar */
    const panelRef = useRef( null )
    const openButtonRef = useRef( null )
    const hasClosed = useRef( false )

    /* Al abrir, el foco va al formulario; al cerrar, vuelve al botón. Al cargar la página no se mueve */
    useEffect( () => {
        if ( isEditing ) panelRef.current?.focus()
        else if ( hasClosed.current ) openButtonRef.current?.focus()
    }, [ isEditing ] )

    /* Cierra el formulario: al guardar o al pulsar "Cerrar sin cambios" */
    const close = () => {
        hasClosed.current = true
        setIsEditing( false )
    }

    /* Antes de pulsar, los dos botones en fila: modificar y cancelar */
    if ( !isEditing ) {
        return (
            <div className="EditBooking-actions">
                <Button ref={openButtonRef} onClick={ () => setIsEditing( true ) }>Modificar reserva</Button>
                {children}
            </div>
        )
    }

    return (
        <div ref={panelRef} tabIndex={-1} className="EditBooking">
            <BookingForm
                days={days}
                editToken={token}
                initial={{ partySize: reservation.partySize, date: reservation.date, time: reservation.time }}
                onDone={close}
            />
            <Button variant="ghost" onClick={close}>Cerrar sin cambios</Button>
        </div>
    )
}
