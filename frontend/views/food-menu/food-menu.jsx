
import { DishList } from '@components/dish-list/dish-list.jsx'
import { FOOD_MENU } from '@const/food-menu.js'
import './food-menu.css'

/* Página de la carta: el título y todas las categorías con sus platos y precios */
export const FoodMenu = () => {

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
            {/* En el índice agrupamos un enlace a cada categoría. Se queda pegado arriba al bajar,
            y cada enlace salta a su categoría por su id (#bocadillos…) */}
            <nav className="FoodMenu-index" aria-label="Categorías de la carta">
                <ul className="Container FoodMenu-indexList">
                    { FOOD_MENU.map( category =>
                        <li key={category.id}>
                            <a href={`#${ category.id }`} className="FoodMenu-indexLink">{category.title}</a>
                        </li>
                    )}
                </ul>
            </nav>
            {/* En las categorías agrupamos toda la carta: cada categoría con su título, sus platos y sus precios */}
            <div className="Container FoodMenu-categories">
                { FOOD_MENU.map( category =>
                    <section key={category.id} id={category.id} className="FoodMenu-category">
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
        </main>
    )
}
