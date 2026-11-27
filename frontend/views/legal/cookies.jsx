
import { LEGAL_UPDATED } from '@const/legal.js'
import './legal.css'

/* Página Política de cookies: la web no usa cookies propias ni de analítica.
Las únicas posibles son las de Google Maps, y solo si la persona pulsa "Ver mapa" */
export const Cookies = () => {

    return (
        <main>
            {/* En el hero de las cookies agrupamos el título y la fecha de actualización */}
            <section className="Container LegalPage-hero">
                <h1 className="LegalPage-title">Política de cookies</h1>
                <p className="LegalPage-updated">Última actualización: {LEGAL_UPDATED}</p>
            </section>
            {/* En el contenido agrupamos los apartados de la política, uno debajo de otro */}
            <section className="Container LegalPage-content">
                <h2 className="LegalPage-heading">Qué son las cookies</h2>
                <p className="LegalPage-text">Son pequeños archivos que algunas webs guardan en tu navegador para recordar cosas, como tus preferencias, o para saber qué páginas visitas.</p>

                <h2 className="LegalPage-heading">Las cookies de esta web</h2>
                <p className="LegalPage-text">Esta web no usa cookies propias, ni de publicidad ni para contar visitas. Por eso no te pedimos permiso al entrar.</p>

                <h2 className="LegalPage-heading">El mapa de Google</h2>
                <p className="LegalPage-text">En el pie de la página verás una imagen fija de la zona. El mapa interactivo de Google Maps solo se carga si pulsas «Ver mapa», y a partir de ese momento Google puede usar sus propias cookies. Puedes consultar cómo las usa en su política de privacidad (policies.google.com).</p>
                <p className="LegalPage-text">Si no pulsas el botón, Google no carga nada en tu navegador.</p>

                <h2 className="LegalPage-heading">Cómo borrar las cookies</h2>
                <p className="LegalPage-text">Puedes ver y borrar las cookies desde los ajustes de tu navegador, normalmente en el apartado de privacidad.</p>

                <h2 className="LegalPage-heading">Cambios en esta política</h2>
                <p className="LegalPage-text">Si algún día la web empieza a usar otras cookies, actualizaremos esta página y te pediremos permiso antes de usarlas.</p>
            </section>
        </main>
    )
}
