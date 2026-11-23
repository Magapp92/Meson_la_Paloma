
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@components/button/button.jsx'
import { PartySizes } from '@components/party-sizes/party-sizes.jsx'
import { CONTACT } from '@const/business.js'
import { ROUTES } from '@const/routes.js'
import { THEMED_NIGHTS } from '@const/themed-nights.js'
import './home.css'

/* Fotos de la tira del hero, con su tamaño original para que Image reserve el hueco.
Pendiente de confirmar con el mesón si las de las gambas y la hamburguesa son suyas */
const HERO_PHOTOS = Object.freeze([
    { src: '/img/garlic-prawns.webp', alt: 'Gambas al ajillo en cazuela de barro', width: 736, height: 491 },
    { src: '/img/meson-bar.webp', alt: 'La barra del mesón', width: 640, height: 427 },
    { src: '/img/burger.webp', alt: 'Hamburguesa con queso, lechuga y tomate', width: 736, height: 491 }
])

/* Platos destacados de la carta, cada uno con su foto y el tamaño original de esta */
const FEATURED_DISHES = Object.freeze([
    { name: 'Sándwich especial "La Paloma"', image: { src: '/img/paloma-sandwich.webp', width: 960, height: 640 } },
    { name: 'Hamburguesa especial de la casa', image: { src: '/img/house-burger-board.webp', width: 960, height: 640 } },
    { name: 'Pollo asado con patatas', image: { src: '/img/roast-chickens.webp', width: 960, height: 640 } },
    { name: 'Entrecot con patatas', image: { src: '/img/entrecote-plate.webp', width: 960, height: 640 } },
    { name: 'T-bone', image: { src: '/img/t-bone-steak.webp', width: 960, height: 640 } },
    { name: 'Costillas asadas barbacoa', image: { src: '/img/bbq-ribs-plate.webp', width: 960, height: 640 } },
    { name: 'Chuletón', image: { src: '/img/rib-steak-plate.webp', width: 960, height: 640 } },
    { name: 'Tomahawk steak', image: { src: '/img/tomahawk-steak.webp', width: 960, height: 640 } }
])

/* Portada de la web: lo que se ve en la ruta / */
export const Home = () => {

    return (
        <main>
            {/* En la sección hero agrupamos el nombre del mesón en grande y a dos tonos, una frase corta,
            los botones para reservar y ver la carta y una tira de tres fotos */}
            <section className="Container Hero">
                <h1 className="Hero-title">
                    {/* El espacio separa las dos palabras para los lectores de pantalla,
                    aunque en pantalla cada parte vaya en su propia línea */}
                    Mesón{' '}
                    <span className="Hero-titleAccent">La Paloma</span>
                </h1>
                <p className="Hero-text">Cocina americana y mediterránea con alma de barrio. Más de 20 años en Valdezarza.</p>
                <div className="Hero-actions">
                    {/* Reservar lleva de momento a la portada: cambiará cuando creemos la página de reservas */}
                    <Button href={ROUTES.HOME} title="Ir a reservar mesa">Reservar mesa</Button>
                    <Button href={ROUTES.FOOD_MENU} variant="ghost" title="Ir a la carta">Ver la carta</Button>
                </div>
                {/* Tira de fotos: en fila en el ordenador y deslizable de lado en el móvil */}
                <ul className="Hero-photos">
                    { HERO_PHOTOS.map( photo =>
                        <li key={photo.src} className="Hero-photo">
                            <Image
                                className="Hero-photoImg"
                                src={photo.src}
                                alt={photo.alt}
                                width={photo.width}
                                height={photo.height}
                                sizes="(max-width: 900px) 80vw, 33vw"
                            />
                        </li>
                    )}
                </ul>
            </section>
            {/* En la sección experiencias agrupamos las cuatro noches temáticas: cada una con su cartel entero,
            sin recortar, y debajo el día y el nombre en texto para que se lea bien */}
            <section className="Container Experiences">
                <h2 className="Experiences-title">Cada día, una experiencia</h2>
                <ul className="Experiences-list">
                    { THEMED_NIGHTS.map( night =>
                        <li key={night.name} className="Experiences-item">
                            <Image
                                className="Experiences-poster"
                                src={night.poster}
                                alt={ night.otherDays
                                    ? `Cartel con la carta de las noches de ${ night.name.toLowerCase() }`
                                    : `Cartel con la carta de la noche de ${ night.name.toLowerCase() } del ${ night.day.toLowerCase() }`
                                }
                                width={675}
                                height={958}
                                sizes="(max-width: 900px) 70vw, 25vw"
                            />
                            {/* Las noches de un día fijo llevan el día encima del nombre;
                            la que se sirve otros días (el picoteo) se llama "Noches de…" y no lleva día */}
                            <p className="Experiences-name">
                                { night.otherDays
                                    ? `Noches de ${ night.name.toLowerCase() }`
                                    : <>
                                        <span className="Experiences-day">{night.day}</span>
                                        {night.name}
                                    </>
                                }
                            </p>
                        </li>
                    )}
                </ul>
            </section>
            {/* En la sección de platos destacados agrupamos una selección de la carta, cada plato con su foto pequeña,
            y el botón para ver la carta completa */}
            <section className="Container FeaturedDishes">
                <h2 className="FeaturedDishes-title">Los favoritos de la casa</h2>
                <ul className="FeaturedDishes-list">
                    { FEATURED_DISHES.map( dish =>
                        <li key={dish.name} className="FeaturedDishes-item">
                            {/* Foto del plato; alt vacío porque el nombre ya va escrito al lado */}
                            <Image
                                className="FeaturedDishes-photo"
                                src={dish.image.src}
                                alt=""
                                width={dish.image.width}
                                height={dish.image.height}
                                sizes="6.5rem"
                            />
                            <p className="FeaturedDishes-name">{dish.name}</p>
                        </li>
                    )}
                </ul>
                <Button href={ROUTES.FOOD_MENU} variant="ghost" title="Ir a la carta">Ver la carta completa</Button>
            </section>
            {/* En la sección de reserva agrupamos la pregunta, el aviso de los grupos
            y los botones con el número de personas */}
            <section className="Container Booking">
                <div className="Booking-box">
                    <h2 className="Booking-title">¿Mesa para cuántos?</h2>
                    <p className="Booking-text">Elige cuántos sois y reserva tu mesa. Si sois más de 6, es una reserva de grupo: llámanos al {CONTACT.phone}.</p>
                    <div className="Booking-sizes">
                        <PartySizes />
                    </div>
                </div>
            </section>
            {/* En la sección historia agrupamos una foto del local,
            un texto corto sobre quiénes somos y el enlace para conocernos más */}
            <section className="Container Story">
                <Image
                    className="Story-photo"
                    src="/img/dining-bar.webp"
                    alt="La barra con taburetes y las mesas del comedor del mesón"
                    width={520}
                    height={346}
                    sizes="(max-width: 900px) 100vw, 50vw"
                />
                <div className="Story-content">
                    <h2 className="Story-title">Nuestra historia</h2>
                    <p className="Story-text">Somos un mesón familiar de barrio. Llevamos más de 20 años en Valdezarza, de los desayunos a las cenas, con cocina americana y mediterránea y el trato cercano de siempre.</p>
                    <Button href={ROUTES.ABOUT} variant="ghost" title="Ir a nosotros">Conócenos</Button>
                </div>
            </section>
            {/* En la sección de grupos agrupamos, en una franja mostaza a todo el ancho, la invitación
            a celebraciones y grupos, el teléfono para reservar y el enlace a los menús */}
            <section className="GroupsBand">
                <div className="Container GroupsBand-inner">
                    <h2 className="GroupsBand-title">Celebraciones y grupos</h2>
                    <div className="GroupsBand-content">
                        <p className="GroupsBand-text">Cumpleaños, comidas de empresa o mesas de más de 6 personas: las reservas de grupo se hacen por teléfono.</p>
                        <p className="GroupsBand-links">
                            Llámanos al <a href={CONTACT.phoneHref} className="GroupsBand-link" title="Llamar al mesón">{CONTACT.phone}</a>
                            {' · '}
                            {/* Ver menús lleva de momento a la portada: cambiará cuando creemos la página de menús y eventos */}
                            <Link href={ROUTES.HOME} className="GroupsBand-link" title="Ir a menús y eventos">Ver menús</Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
