
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NAV_LINKS } from '@const/navigation.js'
import './mobile-menu.css'

/* Menú del móvil: el botón hamburguesa y, al pulsarlo, los enlaces a pantalla completa.
Es un componente de cliente porque tiene que recordar si está abierto y responder al clic */
export const MobileMenu = () => {

    const [ isOpen, setIsOpen ] = useState( false )

    /* Abre el menú si está cerrado y lo cierra si está abierto */
    const toggleMenu = () => {
        setIsOpen( !isOpen )
    }

    const closeMenu = () => {
        setIsOpen( false )
    }

    return (
        <div className="MobileMenu">
            {/* Botón hamburguesa: tres líneas, la última corta y en mostaza. Al abrir el menú se convierte en una X */}
            <button
                type="button"
                className={`MobileMenu-toggle ${ isOpen ? 'isOpen' : '' }`}
                aria-label={ isOpen ? 'Cerrar menú' : 'Abrir menú' }
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
                onClick={toggleMenu}
            >
                <span className="MobileMenu-bar"></span>
                <span className="MobileMenu-bar"></span>
                <span className="MobileMenu-bar"></span>
            </button>
            {/* En el panel agrupamos los enlaces grandes y numerados; solo existe mientras el menú está abierto */}
            { isOpen &&
                <nav id="mobile-menu" className="MobileMenu-panel" aria-label="Principal">
                    <ol className="MobileMenu-list">
                        { NAV_LINKS.map( ( link, index ) =>
                            <li key={link.text}>
                                <Link href={link.href} className="MobileMenu-link" title={link.title} onClick={closeMenu}>
                                    <span className="MobileMenu-number">{ String(index + 1).padStart(2, '0') }</span>
                                    {link.text}
                                </Link>
                            </li>
                        )}
                    </ol>
                </nav>
            }
        </div>
    )
}
