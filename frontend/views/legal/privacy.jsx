
import { CONTACT } from '@const/business.js'
import { OWNER, LEGAL_UPDATED } from '@const/legal.js'
import './legal.css'

/* Página Política de privacidad: qué datos pedimos al reservar, para qué, cuánto tiempo los guardamos,
con quién los compartimos y qué derechos tiene cada cliente. La pide el RGPD */
export const Privacy = () => {

    return (
        <main>
            {/* En el hero de la privacidad agrupamos el título y la fecha de actualización */}
            <section className="Container LegalPage-hero">
                <h1 className="LegalPage-title">Política de privacidad</h1>
                <p className="LegalPage-updated">Última actualización: {LEGAL_UPDATED}</p>
            </section>
            {/* En el contenido agrupamos los apartados de la política, uno debajo de otro */}
            <section className="Container LegalPage-content">
                <h2 className="LegalPage-heading">Responsable de tus datos</h2>
                <ul className="LegalPage-list">
                    <li>Titular: {OWNER.name}</li>
                    <li>NIF: {OWNER.nif}</li>
                    <li>Domicilio: {CONTACT.street}, {CONTACT.city}</li>
                    <li>Correo electrónico: {OWNER.email}</li>
                </ul>

                <h2 className="LegalPage-heading">Qué datos pedimos</h2>
                <p className="LegalPage-text">Al reservar mesa te pedimos tu nombre, tu teléfono y tu correo electrónico, además del día, la hora y cuántas personas venís. Si quieres, puedes añadir notas, por ejemplo una alergia o una trona.</p>
                <p className="LegalPage-text">Si en las notas nos indicas una alergia o intolerancia, la usamos solo para preparar tu visita. Por favor, no escribas otros datos de salud.</p>

                <h2 className="LegalPage-heading">Para qué los usamos</h2>
                <p className="LegalPage-text">Solo para gestionar tu reserva: guardarte la mesa, enviarte el correo de confirmación, recordarte la reserva el día antes y avisarte si la cambias o la cancelas. No los usamos para publicidad ni se los damos a nadie para ese fin.</p>
                <p className="LegalPage-text">Los tratamos porque nos pides la reserva: sin ellos no podríamos guardarte la mesa ni avisarte.</p>

                <h2 className="LegalPage-heading">Cuánto tiempo los guardamos</h2>
                <p className="LegalPage-text">Hasta el final del día de tu reserva. A partir de la medianoche siguiente, la reserva se borra sola con todos sus datos.</p>

                <h2 className="LegalPage-heading">Con quién los compartimos</h2>
                <p className="LegalPage-text">Usamos dos servicios que tratan los datos por encargo nuestro y solo para lo que les pedimos: Brevo, que envía los correos de la reserva, y MongoDB Atlas, donde se guardan las reservas en servidores de París, dentro de la Unión Europea.</p>
                <p className="LegalPage-text">Para evitar abusos, como muchas reservas seguidas desde el mismo sitio, la web anota durante un rato la dirección IP desde la que se reserva. No la guardamos con la reserva.</p>

                <h2 className="LegalPage-heading">Tus derechos</h2>
                <p className="LegalPage-text">Puedes pedirnos ver tus datos, corregirlos o borrarlos, y oponerte a que los usemos o pedir que limitemos su uso. Escríbenos a {OWNER.email} o llámanos al {CONTACT.phone}. También puedes cambiar o cancelar tu reserva desde el enlace del correo de confirmación.</p>
                <p className="LegalPage-text">Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
            </section>
        </main>
    )
}
