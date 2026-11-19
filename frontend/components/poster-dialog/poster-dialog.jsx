
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import './poster-dialog.css'

/* Cartel que se ve en pequeño y, al pulsarlo, se abre en grande en una ventana encima de la página (<dialog>).
El navegador ya cierra el dialog con Escape; nosotros añadimos la X y cerrar al pulsar fuera del cartel.
Es un componente de cliente porque responde a los clics */
export const PosterDialog = ({ src, alt, width, height, sizes }) => {

    const dialogRef = useRef( null )

    const openDialog = () => {
        dialogRef.current.showModal()
    }

    const closeDialog = () => {
        dialogRef.current.close()
    }

    /* El fondo oscuro pertenece al propio dialog: si el clic cae en él y no en el cartel, cerramos */
    const closeOnBackdrop = ( e ) => {
        if ( e.target === dialogRef.current ) closeDialog()
    }

    return (
        <>
            <button type="button" className="PosterDialog-open" onClick={openDialog} title="Ver el cartel en grande">
                <Image className="PosterDialog-thumb" src={src} alt={alt} width={width} height={height} sizes={sizes} />
            </button>
            <dialog ref={dialogRef} className="PosterDialog" onClick={closeOnBackdrop}>
                <button type="button" className="PosterDialog-close" onClick={closeDialog} aria-label="Cerrar el cartel">✕</button>
                <Image className="PosterDialog-image" src={src} alt={alt} width={width} height={height} sizes="(max-width: 900px) 90vw, 40rem" />
            </dialog>
        </>
    )
}
