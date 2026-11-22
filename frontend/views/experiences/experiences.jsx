
import Image from 'next/image'
import { DishList } from '@components/dish-list/dish-list.jsx'
import { THEMED_NIGHTS } from '@const/themed-nights.js'
import './experiences.css'

/* Página de experiencias: las cuatro noches temáticas, cada una con su carta en texto y su cartel */
export const Experiences = () => {

    return (
        <main>
            {/* En el hero de experiencias agrupamos el título a dos tonos y una entradilla */}
            <section className="Container ExperiencesPage-hero">
                <h1 className="ExperiencesPage-title">
                    {/* El espacio separa las dos palabras para los lectores de pantalla */}
                    Nuestras{' '}
                    <span className="ExperiencesPage-titleAccent">Experiencias</span>
                </h1>
                <p className="ExperiencesPage-intro">De miércoles a sábado, en las cenas, una cocina distinta cada noche.</p>
            </section>
            {/* En cada noche agrupamos el día, el nombre, su carta por secciones y su cartel */}
            { THEMED_NIGHTS.map( night =>
                <section key={night.id} id={night.id} className="Container Night">
                    <div className="Night-menu">
                        <p className="Night-day">{night.day} · cenas</p>
                        <h2 className="Night-name">{night.name}</h2>
                        { night.sections.map( ( section, index ) =>
                            <div key={index} className="Night-section">
                                { section.title && <h3 className="Night-sectionTitle">{section.title}</h3> }
                                { section.description && <p className="Night-sectionText">{section.description}</p> }
                                <DishList dishes={section.dishes} />
                            </div>
                        )}
                    </div>
                    {/* El cartel acompaña a la carta: la información ya está en el texto */}
                    <Image
                        className="Night-poster"
                        src={night.poster}
                        alt={`Cartel de la noche de ${ night.name.toLowerCase() } del ${ night.day.toLowerCase() }`}
                        width={675}
                        height={958}
                        sizes="(max-width: 900px) 80vw, 22rem"
                    />
                </section>
            )}
        </main>
    )
}
