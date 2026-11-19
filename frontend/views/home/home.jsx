
import Image from 'next/image'
import { Button } from '@components/button/button.jsx'
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

/* Platos destacados de la carta. El pollo tiene varias opciones, cada una con su precio;
los demás, un solo precio y, si hace falta, una nota */
const FEATURED_DISHES = Object.freeze([
    { name: 'Sándwich especial "La Paloma"', price: 6.5 },
    { name: 'Hamburguesa especial de la casa', price: 10 },
    { name: 'Pollo asado con patatas', options: [
        { text: 'Entero + 2 refrescos', price: 15 },
        { text: 'Medio + 2 refrescos', price: 7.5 },
        { text: 'Entero sin bebida', price: 10 }
    ] },
    { name: 'Entrecot con patatas', price: 14 },
    { name: 'T-bone', price: 25 },
    { name: 'Costillas asadas barbacoa + refresco', price: 15 },
    { name: 'Chuletón', price: 20 },
    { name: 'Tomahawk steak', price: 35, note: 'Con patata americana y mazorca' }
])

/* Escribe un precio a la española: 6.5 pasa a "6,50 €" */
const formatPrice = price => new Intl.NumberFormat( 'es-ES', { style: 'currency', currency: 'EUR' }).format( price )

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
            {/* En la sección de platos destacados agrupamos una selección de la carta con sus precios
            y el botón para ver la carta completa */}
            <section className="Container FeaturedDishes">
                <h2 className="FeaturedDishes-title">Los favoritos de la casa</h2>
                <ul className="FeaturedDishes-list">
                    { FEATURED_DISHES.map( dish =>
                        <li key={dish.name} className="FeaturedDishes-item">
                            <p className="FeaturedDishes-row">
                                <span className="FeaturedDishes-name">{dish.name}</span>
                                { dish.price && <span className="FeaturedDishes-price">{formatPrice( dish.price )}</span> }
                            </p>
                            { dish.note && <p className="FeaturedDishes-note">{dish.note}</p> }
                            {/* Si el plato tiene opciones, cada una va en su línea con su precio */}
                            { dish.options &&
                                <ul className="FeaturedDishes-options">
                                    { dish.options.map( option =>
                                        <li key={option.text} className="FeaturedDishes-row FeaturedDishes-row--option">
                                            <span className="FeaturedDishes-name">{option.text}</span>
                                            <span className="FeaturedDishes-price">{formatPrice( option.price )}</span>
                                        </li>
                                    )}
                                </ul>
                            }
                        </li>
                    )}
                </ul>
                <Button href={ROUTES.FOOD_MENU} variant="ghost" title="Ir a la carta">Ver la carta completa</Button>
            </section>
        </main>
    )
}
