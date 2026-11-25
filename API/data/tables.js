
/* Mesas del comedor que se pueden reservar. Aforo provisional, pendiente de confirmar con el mesón:
6 mesas de 4, 3 de 6 y 2 de 2 (46 comensales). Son los datos que el script seed.js guarda en MongoDB */
const TABLES = [
    { number: 1, seats: 4 },
    { number: 2, seats: 4 },
    { number: 3, seats: 4 },
    { number: 4, seats: 4 },
    { number: 5, seats: 4 },
    { number: 6, seats: 4 },
    { number: 7, seats: 6 },
    { number: 8, seats: 6 },
    { number: 9, seats: 6 },
    { number: 10, seats: 2 },
    { number: 11, seats: 2 }
]

module.exports = {
    TABLES
}
