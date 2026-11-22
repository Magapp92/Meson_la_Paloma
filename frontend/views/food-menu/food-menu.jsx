
import { FOOD_MENU } from '@const/food-menu.js'
import './food-menu.css'

/* Escribe un precio a la española: 6.5 pasa a "6,50 €" */
const formatPrice = price => new Intl.NumberFormat( 'es-ES', { style: 'currency', currency: 'EUR' }).format( price )

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
            {/* En las categorías agrupamos toda la carta: cada categoría con su título, sus platos y sus precios */}
            <div className="Container FoodMenu-categories">
                { FOOD_MENU.map( category =>
                    /* Las categorías con dos precios llevan la variante --columns para alinearlos en columnas */
                    <section
                        key={category.id}
                        id={category.id}
                        className={`FoodMenu-category ${ category.priceLabels ? 'FoodMenu-category--columns' : '' }`}
                    >
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
                        <ul className="FoodMenu-dishes">
                            { category.dishes.map( dish =>
                                <li key={dish.name} className="FoodMenu-dish">
                                    <p className="FoodMenu-dishName">
                                        {dish.name}
                                        { dish.note && <span className="FoodMenu-dishNote">{dish.note}</span> }
                                    </p>
                                    { dish.prices.map( ( price, index ) =>
                                        <p key={index} className="FoodMenu-price">
                                            {/* Nombre de la columna solo para lectores de pantalla: "Media: 5,00 €" */}
                                            { category.priceLabels && <span className="FoodMenu-srOnly">{category.priceLabels[index]}: </span> }
                                            {formatPrice( price )}
                                        </p>
                                    )}
                                </li>
                            )}
                        </ul>
                        { category.note && <p className="FoodMenu-categoryNote">{category.note}</p> }
                    </section>
                )}
            </div>
        </main>
    )
}
