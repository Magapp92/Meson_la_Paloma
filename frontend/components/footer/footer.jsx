
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@components/icon/icon.jsx'
import { MapEmbed } from '@components/map-embed/map-embed.jsx'
import { CONTACT, SOCIAL_LINKS, DAY_NAMES, OPENING_HOURS } from '@const/business.js'
import './footer.css'

/* Enlaces legales. De momento llevan a la portada: cambiarán cuando creemos sus páginas */
const LEGAL_LINKS = Object.freeze([
    { text: 'Privacidad', href: '/', title: 'Ir a la política de privacidad' },
    { text: 'Cookies', href: '/', title: 'Ir a la política de cookies' }
])

/* Autora de la web, con el enlace a su portfolio */
const AUTHOR = Object.freeze({ name: 'Magaly Puente', href: 'https://www.magasporfolio.com/' })

/* Orden de la semana en España, empezando por el lunes (en JavaScript el 0 es el domingo) */
const WEEK_ORDER = Object.freeze([1, 2, 3, 4, 5, 6, 0])

/* Primera letra en mayúscula: "martes" pasa a "Martes" */
const capitalize = ( text ) => text.charAt(0).toUpperCase() + text.slice(1)

/* Junta los días seguidos que tienen el mismo horario: "Martes – Sábado · 08:30 – 01:00".
Los días cerrados van al final de la lista */
const groupOpeningHours = () => {

    const groups = []

    for (const day of WEEK_ORDER) {
        const hours = OPENING_HOURS[day]
        const text = hours ? `${ hours.open } – ${ hours.close }` : 'Cerrado'
        const last = groups[groups.length - 1]

        /* Si el día anterior tenía el mismo horario, alargamos su grupo; si no, empezamos uno nuevo */
        if (last && last.text === text) {
            last.lastDay = day
        } else {
            groups.push({ firstDay: day, lastDay: day, text, isClosed: !hours })
        }
    }

    const rows = groups.map( group => ({
        days: group.firstDay === group.lastDay
            ? capitalize( DAY_NAMES[group.firstDay] )
            : `${ capitalize( DAY_NAMES[group.firstDay] ) } – ${ capitalize( DAY_NAMES[group.lastDay] ) }`,
        text: group.text,
        isClosed: group.isClosed
    }))

    return [...rows.filter( row => !row.isClosed ), ...rows.filter( row => row.isClosed )]
}

/* Pie de todas las páginas: marca y redes, contacto, horario y la línea legal */
export const Footer = () => {

    const hoursRows = groupOpeningHours()

    const year = new Date().getFullYear()

    return (
        <footer className="Footer">
            <div className="Container Footer-inner">
                {/* En la marca agrupamos el logo, el texto del mesón y las redes sociales */}
                <div className="Footer-brand">
                    <Link href="/" className="Footer-logo" title="Ir a la página de inicio">
                        <Image className="Footer-logoImg" src="/img/logo-meson.webp" alt="" width={56} height={56} />
                        <span className="Footer-logoText">
                            Mesón{' '}
                            <span className="Footer-logoTextLine">La Paloma</span>
                        </span>
                    </Link>
                    <p className="Footer-text">Cocina americana y mediterránea con alma familiar. Más de 20 años en el corazón de Madrid.</p>
                    <ul className="Footer-social">
                        { SOCIAL_LINKS.map( social =>
                            <li key={social.name}>
                                <a href={social.href} className="Footer-socialLink" target="_blank" rel="noopener noreferrer"
                                    aria-label={social.name} title={`Ir al ${ social.name } del mesón`}>
                                    <Icon name={social.name.toLowerCase()} />
                                </a>
                            </li>
                        )}
                    </ul>
                </div>
                {/* En el contacto agrupamos la dirección, que abre Google Maps, el teléfono y el correo */}
                <div className="Footer-column">
                    <h2 className="Footer-title">Contacto</h2>
                    <address className="Footer-list">
                        <a href={CONTACT.directionsHref} className="Footer-link" target="_blank" rel="noopener noreferrer" title="Ver cómo llegar en Google Maps">
                            {/* En el ordenador la dirección va en una línea; en el móvil la ciudad baja a la siguiente */}
                            {CONTACT.street}{' '}
                            <span className="Footer-addressCity">{CONTACT.city}</span>
                        </a>
                        <a href={CONTACT.phoneHref} className="Footer-link" title="Llamar al mesón">{CONTACT.phone}</a>
                        <a href={`mailto:${ CONTACT.email }`} className="Footer-link" title="Escribir un correo al mesón">{CONTACT.email}</a>
                    </address>
                </div>
                {/* En el horario agrupamos los días con el mismo horario; los cerrados van al final */}
                <div className="Footer-column">
                    <h2 className="Footer-title">Horario</h2>
                    <dl className="Footer-list">
                        { hoursRows.map( row =>
                            <div key={row.days} className="Footer-hoursRow">
                                <dt>{row.days}</dt>
                                <dd className={ row.isClosed ? 'isClosed' : '' }>{row.text}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
            {/* El mapa, debajo de las columnas y a todo el ancho del contenido */}
            <div className="Container Footer-map">
                <MapEmbed />
            </div>
            {/* En la línea final agrupamos el copyright a la izquierda y, a la derecha,
            los enlaces legales junto al crédito de la autora de la web */}
            <div className="Container Footer-bottom">
                <p>© {year} Mesón La Paloma</p>
                <div className="Footer-bottomLinks">
                    <nav aria-label="Legal">
                        <ul className="Footer-legal">
                            { LEGAL_LINKS.map( link =>
                                <li key={link.text}>
                                    <Link href={link.href} className="Footer-link" title={link.title}>{link.text}</Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                    <p>
                        Diseño y desarrollo:{' '}
                        <a href={AUTHOR.href} className="Footer-link" target="_blank" rel="noopener noreferrer" title={`Ir al portfolio de ${ AUTHOR.name }`}>{AUTHOR.name}</a>
                    </p>
                </div>
            </div>
        </footer>
    )
}
