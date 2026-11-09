import { useEffect, useState } from 'react'

function RegistrarEntrada({ token, onEntradaRegistrada }) {
  const [materiales, setMateriales] = useState([])
  const [materialId, setMaterialId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        const respuesta = await fetch(
          'http://localhost:3000/api/materiales',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const datos = await respuesta.json()

        if (!respuesta.ok) {
          throw new Error(datos.mensaje)
        }

        setMateriales(
          (datos.materiales || []).filter(
            (material) => material.activo === true
          )
        )
      } catch (error) {
        setMensaje(
          error.message || 'No se pudieron cargar los materiales'
        )
      }
    }

    if (token) {
      cargarMateriales()
    }
  }, [token])

  const registrarEntrada = async (e) => {
    e.preventDefault()
    setMensaje('')

    const numeroCantidad = Number(cantidad)

    if (
      !materialId ||
      !Number.isInteger(numeroCantidad) ||
      numeroCantidad <= 0
    ) {
      setMensaje('Selecciona un material y una cantidad válida')
      return
    }

    setCargando(true)

    try {
      const respuesta = await fetch(
        'http://localhost:3000/api/movimientos/entrada',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            material_id: Number(materialId),
            cantidad: numeroCantidad,
            observacion
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'No se pudo registrar la entrada')
      }

      setMensaje('¡Entrada registrada correctamente!')
      setMaterialId('')
      setCantidad('')
      setObservacion('')

      if (onEntradaRegistrada) {
        onEntradaRegistrada()
      }
    } catch (error) {
      setMensaje(error.message || 'Error al registrar la entrada')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="pagina-entrada">
      <h1>Registrar entrada</h1>

      <p>
        Agrega materiales recibidos y el stock se
        actualizará automáticamente.
      </p>

      <form
        onSubmit={registrarEntrada}
        className="formulario-entrada"
      >
        <label htmlFor="material-entrada">Material *</label>

        <select
          id="material-entrada"
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          required
        >
          <option value="">Selecciona un material</option>

          {materiales.map((material) => (
            <option key={material.id} value={material.id}>
              {material.nombre} - Stock: {material.cantidad}
            </option>
          ))}
        </select>

        <label htmlFor="cantidad-entrada">
          Cantidad ingresada *
        </label>

        <input
          id="cantidad-entrada"
          type="number"
          min="1"
          step="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
        />

        <label htmlFor="observacion-entrada">
          Motivo u observación
        </label>

        <textarea
          id="observacion-entrada"
          rows="4"
          maxLength="500"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          placeholder="Ej.: Reposición de materiales"
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrar entrada'}
        </button>

        {mensaje && <p role="status">{mensaje}</p>}
      </form>
    </section>
  )
}

export default RegistrarEntrada
