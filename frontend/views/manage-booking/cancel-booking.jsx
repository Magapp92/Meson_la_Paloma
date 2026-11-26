'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@components/button/button.jsx'
import { request } from '@lib/request.js'
import './cancel-booking.css'

/* Botón para cancelar la reserva desde "Mi reserva", con la confirmación dentro de la propia caja.
Es un componente de cliente porque guarda si se está confirmando o cancelando (useState).
token: el código de la reserva, el mismo del enlace del correo */
export const CancelBooking = ({ token }) => {

    const router = useRouter()

    /* Si se está preguntando "¿Seguro?", si se está cancelando y el error de la API */
    const [ isConfirming, setIsConfirming ] = useState( false )
    const [ isCancelling, setIsCancelling ] = useState( false )
    const [ cancelError, setCancelError ] = useState( '' )

    /* La pregunta, para llevarle el foco al aparecer */
    const questionRef = useRef( null )

    /* Al aparecer la pregunta, el foco va a ella: el teclado y el lector de pantalla siguen ahí */
    useEffect( () => {
        if ( isConfirming ) questionRef.current?.focus()
    }, [ isConfirming ] )

    /* Vuelve al botón inicial, sin el error si lo había */
    const keepReservation = () => {
        setIsConfirming( false )
        setCancelError( '' )
    }

    /* Cancela la reserva en la API (PATCH /api/reservations/:token/cancel).
    - Si va bien, router.refresh() pide la página de nuevo al servidor, que la pinta cancelada y con su aviso.
      El botón sigue en "Cancelando…" hasta que llega.
    - Si falla, su mensaje debajo de los botones */
    const cancelReservation = async () => {
        setIsCancelling( true )
        setCancelError( '' )

        try {
            await request( `/reservations/${ encodeURIComponent( token ) }/cancel`, { method: 'PATCH' })

            router.refresh()
        } catch ( error ) {
            setCancelError( error.message )
            setIsCancelling( false )
        }
    }

    /* Antes de pulsar, solo el botón con borde */
    if ( !isConfirming ) {
        return (
            <div className="CancelBooking">
                <Button variant="ghost" onClick={ () => setIsConfirming( true ) }>Cancelar reserva</Button>
            </div>
        )
    }

    return (
        <div className="CancelBooking">
            {/* La pregunta recibe el foco al aparecer */}
            <p ref={questionRef} tabIndex={-1} className="CancelBooking-question">
                ¿Seguro que quieres cancelarla? La mesa quedará libre para otras personas.
            </p>
            {/* En las acciones agrupamos confirmar y volver atrás */}
            <div className="CancelBooking-actions">
                <Button onClick={cancelReservation} disabled={isCancelling}>{ isCancelling ? 'Cancelando…' : 'Sí, cancelar' }</Button>
                <Button variant="ghost" onClick={keepReservation} disabled={isCancelling}>No, mantenerla</Button>
            </div>
            {/* Si la API no puede cancelarla, su mensaje. role="alert" hace que el lector de pantalla lo lea al aparecer */}
            { cancelError &&
                <p className="CancelBooking-error" role="alert">{cancelError}</p>
            }
        </div>
    )
}
