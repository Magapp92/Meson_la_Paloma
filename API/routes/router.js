
/* Router con todos los endpoints de la API. Cuelgan de /api (lo pone index.js) */
const express = require( 'express' )
const { getMenu } = require( '../controllers/menu' )
const { getAvailability, getDays } = require( '../controllers/availability' )
const { postReservation, getReservation, cancelReservation, updateReservation } = require( '../controllers/reservations' )
const { createReservationLimiter, changeReservationLimiter, readLimiter } = require( '../middlewares/rate-limit' )

const router = express.Router()

/* Cada ruta lleva delante su límite de peticiones (middlewares/rate-limit.js):
las lecturas, readLimiter; crear, createReservationLimiter; modificar y cancelar, changeReservationLimiter */

/* Ruta de prueba: si responde, la API está en marcha */
router.route( '/' )
    .get( readLimiter, ( req, res ) => {
        res.status( 200 ).json({
            message: 'API del Mesón La Paloma en marcha',
            data: null
        })
    })

/* La carta */
router.route( '/menu' )
    .get( readLimiter, getMenu )

/* Los días en los que se puede reservar */
router.route( '/days' )
    .get( readLimiter, getDays )

/* Las horas libres para reservar: ?date=AAAA-MM-DD&partySize=4 */
router.route( '/availability' )
    .get( readLimiter, getAvailability )

/* Las reservas: crear una nueva */
router.route( '/reservations' )
    .post( createReservationLimiter, postReservation )

/* Una reserva, con el código secreto del enlace del correo: leerla y, con PATCH, cambiar el día, la hora y las personas */
router.route( '/reservations/:token' )
    .get( readLimiter, getReservation )
    .patch( changeReservationLimiter, updateReservation )

/* Cancelar una reserva desde "Mi reserva". Es PATCH porque cambia una parte de la reserva (su estado), no la borra.
Comparte el límite con modificar: los dos cuentan como cambios */
router.route( '/reservations/:token/cancel' )
    .patch( changeReservationLimiter, cancelReservation )

module.exports = {
    router
}
