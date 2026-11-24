
/* Controlador de la carta */
const { MenuCategory } = require( '../models' )

/* Pedimos todas las categorías de la carta con sus platos, en el orden de la carta.
Quitamos el _id de Mongo: el frontend usa el slug de cada categoría */
const getMenu = async ( req, res, next ) => {
    try {
        const data = await MenuCategory.find( {}, { _id: 0 } ).sort({ order: 1 })

        res.status( 200 ).json({
            message: 'Mostrando la carta',
            data
        })
    } catch ( error ) {
        next( error )
    }
}

/* Exportamos los controllers para el router */
module.exports = {
    getMenu
}
