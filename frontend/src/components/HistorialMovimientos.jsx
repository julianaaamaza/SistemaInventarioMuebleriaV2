import { useEffect, useState } from 'react'

function HistorialMovimientos({ token }) {
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const controlador = new AbortController()

    const cargarMovimientos = async () => {
      setCargando(true)
      setError('')

      try {
        const respuesta = await fetch(
          'http://localhost:3000/api/movimientos',
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
            datos.mensaje || 'No se pudo cargar el historial'
          )
        }

        if (!controlador.signal.aborted) {
          setMovimientos(datos.movimientos || [])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message || 'Error al consultar los movimientos'
          )
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false)
        }
      }
    }

    if (token) {
      cargarMovimientos()
    } else {
      setCargando(false)
    }

    return () => controlador.abort()
  }, [token])

  // Filtrar movimientos por tipo y nombre del material
  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const coincideTipo =
      filtro === 'todos' || movimiento.tipo === filtro

    const textoBusqueda = busqueda.toLowerCase().trim()

    const coincideBusqueda =
      (movimiento.material_nombre || '')
        .toLowerCase()
        .includes(textoBusqueda) ||
      (movimiento.material_codigo || '')
        .toLowerCase()
        .includes(textoBusqueda)

    return coincideTipo && coincideBusqueda
  })

  // Mostrar fechas en formato chileno
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha'

    const fechaObjeto = new Date(fecha)

    if (Number.isNaN(fechaObjeto.getTime())) {
      return 'Fecha no disponible'
    }

    return fechaObjeto.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <section className="pagina-movimientos">
      <h1>Historial de movimientos</h1>

      <p>
        Consulta las entradas y salidas de materiales
        registradas en el sistema.
      </p>

      <div className="filtros-movimientos">
        <div>
          <label htmlFor="buscar-movimiento">
            Buscar material
          </label>

          <input
            id="buscar-movimiento"
            type="text"
            placeholder="Nombre o código del material"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filtrar-tipo">
            Tipo de movimiento
          </label>

          <select
            id="filtrar-tipo"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
          </select>
        </div>
      </div>

      {cargando && (
        <p>Cargando historial de movimientos...</p>
      )}

      {error && (
        <p role="alert">{error}</p>
      )}

      {!cargando && !error && (
        <>
          <p className="total-movimientos">
            Movimientos encontrados: {movimientosFiltrados.length}
          </p>

          {movimientosFiltrados.length === 0 ? (
            <p>No se encontraron movimientos.</p>
          ) : (
            <div className="tabla-movimientos-contenedor">
              <table className="tabla-movimientos">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Código</th>
                    <th>Material</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Observación</th>
                  </tr>
                </thead>

                <tbody>
                  {movimientosFiltrados.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>
                        {formatearFecha(movimiento.created_at)}
                      </td>

                      <td>{movimiento.material_codigo}</td>

                      <td>{movimiento.material_nombre}</td>

                      <td>
                        <span
                          className={
                            movimiento.tipo === 'entrada'
                              ? 'tipo-entrada'
                              : 'tipo-salida'
                          }
                        >
                          {movimiento.tipo === 'entrada'
                            ? 'Entrada'
                            : 'Salida'}
                        </span>
                      </td>

                      <td>
                        {movimiento.tipo === 'entrada' ? '+' : '-'}
                        {movimiento.cantidad}
                      </td>

                      <td>
                        {movimiento.observacion || 'Sin observación'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default HistorialMovimientos
