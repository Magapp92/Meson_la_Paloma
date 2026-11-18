
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@components/button/button.jsx'
import { Icon } from '@components/icon/icon.jsx'
import { CONTACT } from '@const/business.js'
import './map-embed.css'

/* Mapa de Google con la ubicación del mesón. No se carga hasta que la persona pulsa "Ver mapa":
así Google no instala sus cookies sin permiso y la página carga más rápido.
Mientras tanto se ve una imagen fija de la zona, sacada de OpenStreetMap y guardada en la web.
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
                : <div className="MapEmbed-preview">
                    {/* Imagen fija de la zona, centrada en el mesón. Es decorativa: la dirección va escrita al lado */}
                    <Image className="MapEmbed-image" src="/img/meson-map.webp" alt="" fill sizes="(max-width: 1600px) 100vw, 1536px" />
                    {/* Chincheta encima del mesón, que está justo en el centro de la imagen */}
                    <span className="MapEmbed-pin">
                        <Icon name="pin" />
                    </span>
                    {/* En el contenido agrupamos la dirección, el aviso de las cookies y el botón para cargar el mapa */}
                    <div className="MapEmbed-content">
                        <p className="MapEmbed-address">{CONTACT.street} · {CONTACT.city}</p>
                        <p className="MapEmbed-note">El mapa interactivo se carga desde Google Maps, que puede usar cookies.</p>
                        <Button variant="ghost" onClick={loadMap}>Ver mapa</Button>
                    </div>
                    {/* La licencia de OpenStreetMap pide citarlo siempre que se use su mapa */}
                    <a className="MapEmbed-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
                        title="Ir a la licencia de OpenStreetMap">© OpenStreetMap</a>
                </div>
            }
        </div>
    )
}
