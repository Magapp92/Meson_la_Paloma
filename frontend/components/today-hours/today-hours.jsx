
'use client'

import { useSyncExternalStore } from 'react'
import { TIME_ZONE, DAY_NAMES, OPENING_HOURS } from '@const/business.js'
import './today-hours.css'

/* Número del día de hoy en Madrid (0 domingo … 6 sábado), aunque el navegador esté en otra zona horaria:
pasamos la fecha a texto con la hora de Madrid y la volvemos a leer como fecha */
const getMadridDay = () => {
    const madridNow = new Date( new Date().toLocaleString('en-US', { timeZone: TIME_ZONE }) )

    return madridNow.getDay()
}

/* Texto de la franja para un día: su horario si abre, o cuándo volvemos a abrir si cierra */
const getHoursText = ( day ) => {

    const hours = OPENING_HOURS[day]

    if (hours) {
        return `Hoy abierto · ${ hours.open } – ${ hours.close }`
    }

    /* Buscamos el siguiente día que abre, dando la vuelta a la semana si hace falta */
    for (let i = 1; i <= 7; i++) {
        const nextDay = (day + i) % 7

        if (OPENING_HOURS[nextDay]) {
            return `Hoy cerrado · Abrimos el ${ DAY_NAMES[nextDay] } a las ${ OPENING_HOURS[nextDay].open }`
        }
    }
}

/* useSyncExternalStore pide una función para avisar cuando cambie el valor.
El día no lo vigilamos (basta con calcularlo al cargar la página), así que no se suscribe a nada */
const subscribe = () => () => {}

/* Texto en el navegador: el horario de hoy en Madrid */
const getClientText = () => getHoursText( getMadridDay() )

/* Texto al generar la página en el servidor: vacío, porque allí no se sabe qué día la visitarán */
const getServerText = () => ''

/* Franja mostaza con el horario de hoy. Es un componente de cliente porque el día
se tiene que calcular en el navegador de quien visita la web, no al generar la página */
export const TodayHours = () => {

    /* React usa getServerText al generar la página y getClientText en el navegador, sin que choquen:
    la franja llega vacía (con su altura) y enseguida aparece el texto */
    const text = useSyncExternalStore( subscribe, getClientText, getServerText )

    return (
        <p className="TodayHours">{text}</p>
    )
}
