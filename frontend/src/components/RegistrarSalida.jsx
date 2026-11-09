import { useEffect, useState } from 'react'

function RegistrarSalida({ token }) {
  const [materiales, setMateriales] = useState([])
  const [materialId, setMaterialId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()

    const cargarMateriales = async () => {
      try {
        const respuesta = await fetch(
          'https://inventario-muebleria-backend.onrender.com/api/materiales',
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controlador.signal
          }
        )

        const datos = await respuesta.json()

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje || 'No se pudieron cargar los materiales'
          )
        }

        setMateriales(
          (datos.materiales || []).filter(
            (material) => material.activo === true
          )
        )
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      }
    }

    if (token) cargarMateriales()

    return () => controlador.abort()
  }, [token])

  const materialSeleccionado = materiales.find(
    (material) => material.id === Number(materialId)
  )

  const registrarSalida = async (e) => {
    e.preventDefault()
    setMensaje('')
    setError('')

    const numeroCantidad = Number(cantidad)

    if (
      !materialId ||
      cantidad.trim() === '' ||
      !Number.isSafeInteger(numeroCantidad) ||
      numeroCantidad <= 0
    ) {
      setError('Selecciona un material e ingresa una cantidad válida.')
      return
    }

    if (
      materialSeleccionado &&
      numeroCantidad > materialSeleccionado.cantidad
    ) {
      setError('La cantidad supera el stock disponible.')
      return
    }

    setCargando(true)

    try {
      const respuesta = await fetch(
        'https://inventario-muebleria-backend.onrender.com/api/movimientos/salida',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            material_id: Number(materialId),
            cantidad: numeroCantidad,
            observacion: observacion.trim()
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo registrar la salida'
        )
      }

      setMensaje('¡Salida registrada correctamente!')
      setMaterialId('')
      setCantidad('')
      setObservacion('')

      // Actualizar las cantidades mostradas en el formulario
      const respuestaMateriales = await fetch(
        'https://inventario-muebleria-backend.onrender.com/api/materiales',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (respuestaMateriales.ok) {
        const datosMateriales = await respuestaMateriales.json()
        setMateriales(
          (datosMateriales.materiales || []).filter(
            (material) => material.activo === true
          )
        )
      }
    } catch (err) {
      setError(err.message || 'Error al registrar la salida')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="pagina-salida">
      <h1>Registrar salida</h1>

      <p>
        Registra los materiales utilizados en la mueblería
        y descuenta automáticamente su stock.
      </p>

      <form
        className="formulario-salida"
        onSubmit={registrarSalida}
      >
        <label htmlFor="material-salida">Material *</label>

        <select
          id="material-salida"
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

        {materialSeleccionado && (
          <p>
            Stock disponible: <strong>
              {materialSeleccionado.cantidad} {materialSeleccionado.unidad_medida}
            </strong>
          </p>
        )}

        <label htmlFor="cantidad-salida">
          Cantidad utilizada *
        </label>

        <input
          id="cantidad-salida"
          type="number"
          min="1"
          step="1"
          max={materialSeleccionado?.cantidad}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
        />

        <label htmlFor="observacion-salida">
          Motivo u observación
        </label>

        <textarea
          id="observacion-salida"
          rows="4"
          maxLength="500"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          placeholder="Ej.: Material utilizado para fabricar un mueble"
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrar salida'}
        </button>

        {error && <p role="alert">{error}</p>}
        {mensaje && <p role="status">{mensaje}</p>}
      </form>
    </section>
  )
}

export default RegistrarSalida
