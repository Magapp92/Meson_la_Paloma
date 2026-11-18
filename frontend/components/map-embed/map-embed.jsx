
'use client'

import { useState } from 'react'
import { Button } from '@components/button/button.jsx'
import { CONTACT } from '@const/business.js'
import './map-embed.css'

/* Mapa de Google con la ubicación del mesón. No se carga hasta que la persona pulsa "Ver mapa":
así Google no instala sus cookies sin permiso y la página carga más rápido.
Es un componente de cliente porque tiene que recordar si ya se ha pulsado */
export const MapEmbed = () => {

    const [ isLoaded, setIsLoaded ] = useState( false )

    const loadMap = () => {
        setIsLoaded( true )
    }

    return (
        <div className="MapEmbed">
            { isLoaded
                ? <iframe
                    className="MapEmbed-frame"
                    src={CONTACT.mapEmbedSrc}
                    title="Mapa con la ubicación del Mesón La Paloma"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                />
                : <div className="MapEmbed-placeholder">
                    {/* Mientras no se carga, enseñamos la dirección y avisamos de que el mapa es de Google */}
                    <p className="MapEmbed-address">{CONTACT.street} · {CONTACT.city}</p>
                    <p className="MapEmbed-note">El mapa se carga desde Google Maps, que puede usar cookies.</p>
                    <Button variant="ghost" onClick={loadMap}>Ver mapa</Button>
                </div>
            }
        </div>
    )
}
