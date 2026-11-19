
import Image from 'next/image'
import { Button } from '@components/button/button.jsx'
import { CONTACT } from '@const/business.js'
import { ROUTES } from '@const/routes.js'
import './home.css'

/* Fotos de la tira del hero, con su tamaño original para que Image reserve el hueco.
Pendiente de confirmar con el mesón si las de las gambas y la hamburguesa son suyas */
const HERO_PHOTOS = Object.freeze([
    { src: '/img/garlic-prawns.webp', alt: 'Gambas al ajillo en cazuela de barro', width: 736, height: 491 },
    { src: '/img/meson-bar.webp', alt: 'La barra del mesón', width: 640, height: 427 },
    { src: '/img/burger.webp', alt: 'Hamburguesa con queso, lechuga y tomate', width: 736, height: 491 }
])

/* Noches temáticas: el día, el nombre y su cartel (todos miden 675 × 958) */
const THEMED_NIGHTS = Object.freeze([
    { day: 'Miércoles', name: 'Picoteo', poster: '/img/wednesday-tapas.webp' },
    { day: 'Jueves', name: 'Mexicano', poster: '/img/thursday-mexican.webp' },
    { day: 'Viernes', name: 'Francés', poster: '/img/friday-french.webp' },
    { day: 'Sábado', name: 'Americano', poster: '/img/saturday-american.webp' }
])

/* Platos destacados de la carta, con una nota si hace falta.
Las fotos se añadirán cuando tengamos las del Instagram del mesón */
const FEATURED_DISHES = Object.freeze([
    { name: 'Sándwich especial "La Paloma"' },
    { name: 'Hamburguesa especial de la casa' },
    { name: 'Pollo asado con patatas' },
    { name: 'Entrecot con patatas' },
    { name: 'T-bone' },
    { name: 'Costillas asadas barbacoa + refresco' },
    { name: 'Chuletón' },
    { name: 'Tomahawk steak', note: 'Con patata americana y mazorca' }
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
                                alt={`Cartel con la carta de la noche de ${ night.name.toLowerCase() } del ${ night.day.toLowerCase() }`}
                                width={675}
                                height={958}
                                sizes="(max-width: 900px) 70vw, 25vw"
                            />
                            <p className="Experiences-name">
                                <span className="Experiences-day">{night.day}</span>
                                {night.name}
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
                            {/* Hueco de la foto con su tamaño final, hasta que tengamos las fotos de los platos */}
                            <span className="FeaturedDishes-photo" aria-hidden="true" />
                            <div className="FeaturedDishes-text">
                                <p className="FeaturedDishes-name">{dish.name}</p>
                                { dish.note && <p className="FeaturedDishes-note">{dish.note}</p> }
                            </div>
                        </li>
                    )}
                </ul>
                <Button href={ROUTES.FOOD_MENU} variant="ghost" title="Ir a la carta">Ver la carta completa</Button>
            </section>
            {/* En la sección de celebraciones agrupamos la invitación a grupos y eventos,
            con los botones para llamar y ver los menús */}
            <section className="Container Celebrations">
                <div className="Celebrations-box">
                    <h2 className="Celebrations-title">Celebraciones y grupos</h2>
                    <p className="Celebrations-text">Cumpleaños, comidas de empresa o una mesa grande con la familia: llámanos y lo hablamos.</p>
                    <div className="Celebrations-actions">
                        <Button href={CONTACT.phoneHref} title="Llamar al mesón">Llamar al {CONTACT.phone}</Button>
                        {/* Ver menús lleva de momento a la portada: cambiará cuando creemos la página de menús y eventos */}
                        <Button href={ROUTES.HOME} variant="ghost" title="Ir a menús y eventos">Ver menús</Button>
                    </div>
                </div>
            </section>
            {/* En la sección historia agrupamos la foto del equipo en la puerta del mesón,
            un texto corto sobre quiénes somos y el enlace para conocernos más */}
            <section className="Container Story">
                <Image
                    className="Story-photo"
                    src="/img/team-entrance.webp"
                    alt="El equipo del mesón en la puerta del local, bajo el rótulo Mesón La Paloma"
                    width={903}
                    height={656}
                    sizes="(max-width: 900px) 100vw, 50vw"
                />
                <div className="Story-content">
                    <h2 className="Story-title">Nuestra historia</h2>
                    <p className="Story-text">Somos un mesón familiar de barrio. Llevamos más de 20 años en Valdezarza, de los desayunos a las cenas, con cocina americana y mediterránea y el trato cercano de siempre.</p>
                    {/* Conócenos lleva de momento a la portada: cambiará cuando creemos la página Nosotros */}
                    <Button href={ROUTES.HOME} variant="ghost" title="Ir a nosotros">Conócenos</Button>
                </div>
            </section>
        </main>
    )
}
