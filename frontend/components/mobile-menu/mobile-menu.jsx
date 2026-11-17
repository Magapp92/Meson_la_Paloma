
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NAV_LINKS } from '@const/navigation.js'
import './mobile-menu.css'

/* Menú del móvil: el botón hamburguesa y, al pulsarlo, los enlaces a pantalla completa.
Es un componente de cliente porque tiene que recordar si está abierto y responder al clic */
export const MobileMenu = () => {

    const [ isOpen, setIsOpen ] = useState( false )

    /* Mientras el menú está abierto: la página de debajo no hace scroll, la tecla Escape lo cierra
    y, si la pantalla se ensancha hasta el tamaño de escritorio (al girar una tablet), se cierra solo.
    La función del return deshace todo al cerrarlo */
    useEffect(() => {

        if (!isOpen) return

        /* La misma media query que usa el CSS para mostrar el menú del móvil */
        const mobile = window.matchMedia('(max-width: 56.25em)')

        const closeWithEscape = ( e ) => {
            if (e.key === 'Escape') setIsOpen( false )
        }

        /* Si la pantalla deja de cumplir la media query del móvil, cerramos */
        const closeOnDesktop = ( e ) => {
            if (!e.matches) setIsOpen( false )
        }

        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', closeWithEscape)
        mobile.addEventListener('change', closeOnDesktop)

        return () => {
            document.body.style.overflow = ''
            document.removeEventListener('keydown', closeWithEscape)
            mobile.removeEventListener('change', closeOnDesktop)
        }
    }, [isOpen])

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
