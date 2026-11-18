
import './food-menu.css'

/* Página de la carta: de momento solo su cabecera; los platos llegarán más adelante */
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
        </main>
    )
}
