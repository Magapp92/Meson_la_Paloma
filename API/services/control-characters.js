
/* Caracteres que no pueden ir en un dato de una sola línea (nombre, teléfono, correo) ni en la invitación de calendario:
- Los de control: del 0 al 31 (saltos de línea, retornos de carro, tabuladores…) y el 127.
- Los saltos de línea de Unicode: \u0085 (siguiente línea), \u2028 (separador de línea) y \u2029 (separador de párrafo).
- Los que cambian la dirección del texto: \u202A–\u202E y \u2066–\u2069. Pueden darle la vuelta a lo que se ve
  (un nombre que parece otro) sin que cambie lo que se guarda.
Va sin la bandera g: así test() no recuerda la posición entre una llamada y otra. Donde hay que reemplazarlos
todos (en el .ics) se crea una copia con la g a partir de este mismo patrón */
const CONTROL_CHARACTERS = /[\x00-\x1F\x7F\u0085\u2028\u2029\u202A-\u202E\u2066-\u2069]/

/* Lo usan la validación de las reservas y la invitación de calendario */
module.exports = {
    CONTROL_CHARACTERS
}
