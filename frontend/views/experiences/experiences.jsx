
import { BookingBand } from '@components/booking-band/booking-band.jsx'
import { DishList } from '@components/dish-list/dish-list.jsx'
import { THEMED_NIGHTS } from '@const/themed-nights.js'
import './experiences.css'

/* Página de experiencias: las cuatro noches temáticas, cada una con su carta en texto sobre la bandera de su país */
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
                <p className="ExperiencesPage-intro">Cada noche, una cocina distinta: jueves mexicano, viernes francés y sábado americano. Ven a disfrutar del picoteo.</p>
            </section>
            {/* En cada noche agrupamos, sobre la bandera de su país si la tiene, el día, el nombre y su carta por secciones */}
            { THEMED_NIGHTS.map( night =>
                <section key={night.id} id={night.id} className="Container Night">
                    {/* La variante de la tarjeta (Night-card--mx…) elige la bandera del fondo; sin flag, no hay bandera */}
                    <div className={`Night-card ${ night.flag ? `Night-card--${ night.flag }` : '' }`}>
                        {/* El día solo en las noches que no se sirven otros días */}
                        { !night.otherDays && <p className="Night-day">{night.day} · cenas</p> }
                        <h2 className="Night-name">{night.name}</h2>
                        <div className="Night-sections">
                            { night.sections.map( ( section, index ) =>
                                <div key={index} className="Night-section">
                                    { section.title && <h3 className="Night-sectionTitle">{section.title}</h3> }
                                    { section.description && <p className="Night-sectionText">{section.description}</p> }
                                    <DishList dishes={section.dishes} />
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}
            <BookingBand />
        </main>
    )
}
