import Link from 'next/link'
import './button.css'

/* Botón con forma de píldora. Si recibe href pinta un enlace de Next, porque lleva a otra página;
si no, pinta un <button> para acciones como enviar un formulario */
export const Button = (props) => {

    const { href, variant = 'primary', children, ...rest } = props

    const className = `Button Button--${variant}`

    if (href) {
        return <Link href={href} className={className} {...rest}>{children}</Link>
    }

    return <button type="button" className={className} {...rest}>{children}</button>
}
