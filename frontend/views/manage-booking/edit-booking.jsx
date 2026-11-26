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

    /* Si se acaba de guardar un cambio, para avisar. El estado se mantiene tras router.refresh() */
    const [ isSaved, setIsSaved ] = useState( false )

    /* El formulario y el botón de abrirlo, para llevarles el foco al abrir y al cerrar */
    const panelRef = useRef( null )
    const openButtonRef = useRef( null )
    const hasClosed = useRef( false )

    /* Al abrir, el foco va al formulario; al cerrar, vuelve al botón. Al cargar la página no se mueve */
    useEffect( () => {
        if ( isEditing ) panelRef.current?.focus()
        else if ( hasClosed.current ) openButtonRef.current?.focus()
    }, [ isEditing ] )

    /* Abre el formulario. Si había aviso de cambio guardado, desaparece */
    const open = () => {
        setIsSaved( false )
        setIsEditing( true )
    }

    /* Cierra el formulario: al guardar o al pulsar "Cerrar sin cambios" */
    const close = () => {
        hasClosed.current = true
        setIsEditing( false )
    }

    /* Al guardar, el formulario llama a onDone con { isSaved: true }: se cierra y se avisa */
    const finish = ({ isSaved }) => {
        setIsSaved( isSaved )
        close()
    }

    /* Antes de pulsar, los dos botones en fila: modificar y cancelar */
    if ( !isEditing ) {
        return (
            <>
                {/* Tras guardar un cambio, el aviso encima de los botones.
                role="status" hace que el lector de pantalla lo lea en voz alta al aparecer */}
                { isSaved &&
                    <p className="EditBooking-saved" role="status">Reserva modificada. Te hemos enviado un correo con los datos nuevos.</p>
                }
                <div className="EditBooking-actions">
                    <Button ref={openButtonRef} onClick={open}>Modificar reserva</Button>
                    {children}
                </div>
            </>
        )
    }

    return (
        <div ref={panelRef} tabIndex={-1} className="EditBooking">
            <BookingForm
                days={days}
                editToken={token}
                initial={{ partySize: reservation.partySize, date: reservation.date, time: reservation.time }}
                onDone={finish}
            />
            <Button variant="ghost" onClick={close}>Cerrar sin cambios</Button>
        </div>
    )
}
