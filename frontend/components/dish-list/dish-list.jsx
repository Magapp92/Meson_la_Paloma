
import './dish-list.css'

/* Escribe un precio a la española: 6.5 pasa a "6,50 €" */
const formatPrice = price => new Intl.NumberFormat( 'es-ES', { style: 'currency', currency: 'EUR' }).format( price )

/* Lista de platos con su nota y sus precios, como en una carta. La usan la Carta y Experiencias.
Si recibe priceLabels (Normal / Montado, Ración / Media), los precios van en dos columnas alineadas
y cada uno lleva el nombre de su columna para los lectores de pantalla */
export const DishList = ({ dishes, priceLabels }) => {

    return (
        <ul className={`DishList ${ priceLabels ? 'DishList--columns' : '' }`}>
            { dishes.map( dish =>
                <li key={dish.name} className="DishList-dish">
                    <p className="DishList-name">
                        {dish.name}
                        { dish.note && <span className="DishList-note">{dish.note}</span> }
                    </p>
                    { dish.prices.map( ( price, index ) =>
                        <p key={index} className="DishList-price">
                            {/* Nombre de la columna solo para lectores de pantalla: "Media: 5,00 €" */}
                            { priceLabels && <span className="DishList-srOnly">{priceLabels[index]}: </span> }
                            {formatPrice( price )}
                        </p>
                    )}
                </li>
            )}
        </ul>
    )
}
