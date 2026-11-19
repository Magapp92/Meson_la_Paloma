
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
        </main>
    )
}
