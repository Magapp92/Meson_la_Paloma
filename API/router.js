
/* Router con todos los endpoints de la API. Cuelgan de /api (lo pone index.js) */
const express = require( 'express' )
const { getMenu } = require( './controllers/menu' )
const { getAvailability, getDays } = require( './controllers/availability' )
const { postReservation, getReservation, cancelReservation } = require( './controllers/reservations' )

const router = express.Router()

/* Ruta de prueba: si responde, la API está en marcha */
router.route( '/' )
    .get( ( req, res ) => {
        res.status( 200 ).json({
            message: 'API del Mesón La Paloma en marcha',
            data: null
        })
    })

/* La carta */
router.route( '/menu' )
    .get( getMenu )

/* Los días en los que se puede reservar */
router.route( '/days' )
    .get( getDays )

/* Las horas libres para reservar: ?date=AAAA-MM-DD&partySize=4 */
router.route( '/availability' )
    .get( getAvailability )

/* Las reservas: crear una nueva */
router.route( '/reservations' )
    .post( postReservation )

/* Una reserva, con el código secreto del enlace del correo */
router.route( '/reservations/:token' )
    .get( getReservation )

/* Cancelar una reserva desde "Mi reserva". Es PATCH porque cambia una parte de la reserva (su estado), no la borra */
router.route( '/reservations/:token/cancel' )
    .patch( cancelReservation )

module.exports = {
    router
}
