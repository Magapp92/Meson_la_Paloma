
import { BookingBand } from '@components/booking-band/booking-band.jsx'
import { DishList } from '@components/dish-list/dish-list.jsx'
import { CONTACT } from '@const/business.js'
import './food-menu.css'

/* Pide la carta a la API (GET /api/menu) y devuelve la lista de categorías.
Next guarda la respuesta y la vuelve a pedir como mucho cada hora (revalidate).
Si la API no responde o contesta con error, devuelve null y la página muestra un aviso */
const getMenu = async () => {
    try {
        const res = await fetch( `${ process.env.API_URL }/menu`, { next: { revalidate: 3600 } })

        if ( !res.ok ) return null

        const { data } = await res.json()

        return data
    } catch {
        return null
    }
}

/* Página de la carta: el título y todas las categorías con sus platos y precios, que llegan de la API.
Es async porque tiene que esperar a la API antes de pintar */
export const FoodMenu = async () => {

    const menu = await getMenu()

    return (
        <main>
            {/* En el hero de la carta agrupamos el título a dos tonos y una entradilla */}
            <section className="Container FoodMenu-hero">
                <h1 className="FoodMenu-title">
                    {/* El espacio separa las dos palabras para los lectores de pantalla */}
                    Nuestra{' '}
                    <span className="FoodMenu-titleAccent">Carta</span>
                </h1>
                <p className="FoodMenu-intro">Cocina americana y mediterránea, de la barra a la mesa.</p>
            </section>
            { menu
                /* El índice y las categorías van juntos en este bloque: el índice se queda pegado arriba
                solo mientras dura el bloque, y desaparece cuando se acaba la carta */
                ? <div className="FoodMenu-body">
                    {/* En el índice agrupamos un enlace a cada categoría. Se queda pegado arriba al bajar,
                    y cada enlace salta a su categoría por su slug (#bocadillos…) */}
                    <nav className="FoodMenu-index" aria-label="Categorías de la carta">
                        <ul className="Container FoodMenu-indexList">
                            { menu.map( category =>
                                <li key={category.slug}>
                                    <a href={`#${ category.slug }`} className="FoodMenu-indexLink">{category.title}</a>
                                </li>
                            )}
                        </ul>
                    </nav>
                    {/* En las categorías agrupamos toda la carta: cada categoría con su título, sus platos y sus precios */}
                    <div className="Container FoodMenu-categories">
                        { menu.map( category =>
                            <section key={category.slug} id={category.slug} className="FoodMenu-category">
                                <div className="FoodMenu-categoryHead">
                                    <h2 className="FoodMenu-categoryTitle">{category.title}</h2>
                                    {/* Cabecera de las columnas de precio (Normal / Montado, Ración / Media).
                                    Se oculta a los lectores de pantalla porque cada precio ya dice a qué columna pertenece */}
                                    { category.priceLabels &&
                                        <p className="FoodMenu-priceLabels" aria-hidden="true">
                                            { category.priceLabels.map( label =>
                                                <span key={label} className="FoodMenu-priceLabel">{label}</span>
                                            )}
                                        </p>
                                    }
                                </div>
                                <DishList dishes={category.dishes} priceLabels={category.priceLabels} />
                                { category.note && <p className="FoodMenu-categoryNote">{category.note}</p> }
                            </section>
                        )}
                    </div>
                </div>
                /* Si la API no responde, un aviso con el teléfono en lugar de la carta */
                : <div className="Container FoodMenu-error">
                    <p className="FoodMenu-errorText">
                        Ahora mismo no podemos mostrar la carta. Llámanos al{' '}
                        <a href={CONTACT.phoneHref} className="FoodMenu-errorLink" title="Llamar al mesón">{CONTACT.phone}</a>
                        {' '}y te la contamos.
                    </p>
                </div>
            }
            <BookingBand />
        </main>
    )
}
