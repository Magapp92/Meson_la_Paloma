
import Image from 'next/image'
import './about.css'

/* La fachada antes y ahora, las dos en 4:3 con su tamaño original */
const FACADES = Object.freeze([
    { label: 'Antes', src: '/img/facade-before.webp', alt: 'Fachada antigua del mesón, con el rótulo verde', width: 333, height: 250 },
    { label: 'Ahora', src: '/img/facade-now.webp', alt: 'Fachada actual del mesón, con el rótulo negro', width: 583, height: 437 }
])

/* Fotos del local para la galería, con su tamaño original */
const VENUE_PHOTOS = Object.freeze([
    { src: '/img/dining-bar.webp', alt: 'La barra con taburetes y las mesas del comedor', width: 520, height: 346 },
    { src: '/img/dining-room.webp', alt: 'Rincón del comedor con revestimiento de madera', width: 520, height: 347 },
    { src: '/img/dining-tables.webp', alt: 'Mesas de madera y sillas negras junto a la entrada', width: 520, height: 346 },
    { src: '/img/kitchen.webp', alt: 'La cocina del mesón', width: 540, height: 360 }
])

/* Página Nosotros: la historia del mesón, la fachada antes y ahora y una galería del local */
export const About = () => {

    return (
        <main>
            {/* En el hero de nosotros agrupamos el título a dos tonos */}
            <section className="Container AboutPage-hero">
                <h1 className="AboutPage-title">
                    {/* El espacio separa las dos palabras para los lectores de pantalla */}
                    Nuestra{' '}
                    <span className="AboutPage-titleAccent">Historia</span>
                </h1>
            </section>
            {/* En la historia agrupamos el texto sobre el mesón */}
            <section className="Container AboutStory">
                <p className="AboutStory-text">El Mesón La Paloma es un mesón familiar de barrio, en la calle Artajona, en Valdezarza. Llevamos más de 20 años abriendo cada día para los vecinos y para quien pasa por aquí: desayunos, comidas, raciones para compartir y cenas.</p>
                <p className="AboutStory-text">Con los años el mesón ha cambiado de cara, pero seguimos siendo un sitio de trato cercano, con cocina americana y mediterránea y noches temáticas que cambian cada día.</p>
            </section>
            {/* En antes y ahora agrupamos las dos fachadas, una al lado de la otra, cada una con su rótulo */}
            <section className="Container Facades">
                <h2 className="AboutPage-sectionTitle">Antes y ahora</h2>
                <div className="Facades-list">
                    { FACADES.map( facade =>
                        <figure key={facade.label} className="Facades-item">
                            <Image
                                className="Facades-photo"
                                src={facade.src}
                                alt={facade.alt}
                                width={facade.width}
                                height={facade.height}
                                sizes="(max-width: 900px) 100vw, 25rem"
                            />
                            <figcaption className="Facades-label">{facade.label}</figcaption>
                        </figure>
                    )}
                </div>
            </section>
            {/* En el local agrupamos una galería de fotos del comedor, la barra y la cocina */}
            <section className="Container Venue">
                <h2 className="AboutPage-sectionTitle">El local</h2>
                <ul className="Venue-list">
                    { VENUE_PHOTOS.map( photo =>
                        <li key={photo.src}>
                            <Image
                                className="Venue-photo"
                                src={photo.src}
                                alt={photo.alt}
                                width={photo.width}
                                height={photo.height}
                                sizes="(max-width: 900px) 50vw, 25vw"
                            />
                        </li>
                    )}
                </ul>
            </section>
        </main>
    )
}
