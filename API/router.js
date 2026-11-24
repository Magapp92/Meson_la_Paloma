
/* Router con todos los endpoints de la API. Cuelgan de /api (lo pone index.js) */
const express = require( 'express' )
const { getMenu } = require( './controllers/menu' )

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

module.exports = {
    router
}
