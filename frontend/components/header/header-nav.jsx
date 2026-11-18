
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, isActiveLink } from '@const/navigation.js'

/* Menú de la cabecera. Está separado del Header porque necesita saber en qué página estamos
(usePathname), y eso solo se puede en un componente de cliente. Usa las clases de header.css */
export const HeaderNav = () => {

    const pathname = usePathname()

    return (
        <nav className="Header-nav" aria-label="Principal">
            { NAV_LINKS.map( link => {

                const isActive = isActiveLink( link.href, pathname )

                return (
                    <Link
                        key={link.text}
                        href={link.href}
                        className={`Header-link ${ isActive ? 'isActive' : '' }`}
                        aria-current={ isActive ? 'page' : undefined }
                        title={link.title}
                    >
                        {link.text}
                    </Link>
                )
            })}
        </nav>
    )
}
