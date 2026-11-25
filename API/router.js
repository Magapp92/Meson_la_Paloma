
/* Router con todos los endpoints de la API. Cuelgan de /api (lo pone index.js) */
const express = require( 'express' )
const { getMenu } = require( './controllers/menu' )
const { getAvailability } = require( './controllers/availability' )
const { postReservation } = require( './controllers/reservations' )

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

/* Las horas libres para reservar: ?date=AAAA-MM-DD&partySize=4 */
router.route( '/availability' )
    .get( getAvailability )

/* Las reservas: crear una nueva */
router.route( '/reservations' )
    .post( postReservation )

module.exports = {
    router
}
