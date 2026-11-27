
import { CONTACT } from '@const/business.js'
import { OWNER, LEGAL_UPDATED } from '@const/legal.js'
import './legal.css'

/* Página Aviso legal: quién es el titular de la web y las condiciones para usarla.
La pide la ley española (LSSI) a cualquier web de una empresa o un negocio */
export const LegalNotice = () => {

    return (
        <main>
            {/* En el hero del aviso legal agrupamos el título y la fecha de actualización */}
            <section className="Container LegalPage-hero">
                <h1 className="LegalPage-title">Aviso legal</h1>
                <p className="LegalPage-updated">Última actualización: {LEGAL_UPDATED}</p>
            </section>
            {/* En el contenido agrupamos los apartados del aviso legal, uno debajo de otro */}
            <section className="Container LegalPage-content">
                <h2 className="LegalPage-heading">Titular de la web</h2>
                <p className="LegalPage-text">Esta web es del Mesón La Paloma. Los datos del titular son:</p>
                <ul className="LegalPage-list">
                    <li>Titular: {OWNER.name}</li>
                    <li>NIF: {OWNER.nif}</li>
                    <li>Domicilio: {CONTACT.street}, {CONTACT.city}</li>
                    <li>Teléfono: {CONTACT.phone}</li>
                    <li>Correo electrónico: {OWNER.email}</li>
                </ul>

                <h2 className="LegalPage-heading">Uso de la web</h2>
                <p className="LegalPage-text">La web sirve para conocer el mesón, consultar la carta y reservar mesa. Quien la visita se compromete a usarla de buena fe y a no hacer reservas falsas ni con datos de otras personas.</p>

                <h2 className="LegalPage-heading">Propiedad intelectual</h2>
                <p className="LegalPage-text">Los textos, las fotos, el logotipo y el diseño de la web son del Mesón La Paloma o tiene permiso para usarlos. No se pueden copiar ni usar con otros fines sin su autorización.</p>

                <h2 className="LegalPage-heading">Responsabilidad</h2>
                <p className="LegalPage-text">Cuidamos que la información de la web (carta, precios y horarios) esté al día, pero puede cambiar sin aviso. Los enlaces a otras webs, como las redes sociales o Google Maps, llevan a páginas que no controlamos.</p>

                <h2 className="LegalPage-heading">Ley aplicable</h2>
                <p className="LegalPage-text">Este aviso legal se rige por la ley española.</p>
            </section>
        </main>
    )
}
