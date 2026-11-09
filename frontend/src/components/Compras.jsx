import { useEffect, useState } from 'react'

function Compras({ token }) {
  const [materiales, setMateriales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const controlador = new AbortController()

    const cargarCompras = async () => {
      setCargando(true)
      setError('')

      try {
        const respuesta = await fetch(
          'http://localhost:3000/api/compras/pendientes',
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
            datos.mensaje ||
            'No se pudieron cargar las compras pendientes'
          )
        }

        if (!controlador.signal.aborted) {
          setMateriales(datos.materiales || [])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message || 'Error al consultar las compras'
          )
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false)
        }
      }
    }

    if (token) {
      cargarCompras()
    } else {
      setCargando(false)
    }

    return () => controlador.abort()
  }, [token])

  // Filtrar materiales por nombre o código
  const materialesFiltrados = materiales.filter((material) => {
    const texto = busqueda.toLowerCase().trim()

    return (
      (material.nombre || '').toLowerCase().includes(texto) ||
      (material.codigo || '').toLowerCase().includes(texto)
    )
  })

  // Contar materiales agotados y con bajo stock
  const totalAgotados = materiales.filter(
    (material) => material.cantidad === 0
  ).length

  const totalBajoStock = materiales.filter(
    (material) => material.cantidad > 0
  ).length

  return (
    <section className="pagina-compras">
      <h1>Compras y reposición</h1>

      <p>
        Revisa los materiales que necesitan reposición
        para mantener el inventario de la mueblería.
      </p>

      {cargando && (
        <p>Cargando materiales pendientes...</p>
      )}

      {error && (
        <p role="alert">{error}</p>
      )}

      {!cargando && !error && (
        <>
          {/* RESUMEN */}
          <div className="resumen-compras">

            <div className="tarjeta-compra">
              <h3>Materiales por reponer</h3>
              <h2>{materiales.length}</h2>
            </div>

            <div className="tarjeta-compra">
              <h3>Bajo stock</h3>
              <h2>{totalBajoStock}</h2>
            </div>

            <div className="tarjeta-compra">
              <h3>Agotados</h3>
              <h2>{totalAgotados}</h2>
            </div>

          </div>

          {/* BUSCADOR */}
          <div className="filtros-compras">
            <label htmlFor="buscar-compra">
              Buscar material
            </label>

            <input
              id="buscar-compra"
              type="text"
              placeholder="Nombre o código del material"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* TABLA DE COMPRAS */}
          {materialesFiltrados.length === 0 ? (
            <div className="mensaje-compras">
              <p>
                {materiales.length === 0
                  ? '¡Excelente! No hay materiales pendientes de reposición.'
                  : 'No se encontraron materiales con esa búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="tabla-compras-contenedor">
              <table className="tabla-compras">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Material</th>
                    <th>Categoría</th>
                    <th>Stock actual</th>
                    <th>Stock mínimo</th>
                    <th>Cantidad sugerida</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {materialesFiltrados.map((material) => (
                    <tr key={material.id}>
                      <td>{material.codigo}</td>

                      <td>{material.nombre}</td>

                      <td>{material.categoria || 'Sin categoría'}</td>

                      <td>
                        {material.cantidad} {material.unidad_medida}
                      </td>

                      <td>
                        {material.stock_minimo} {material.unidad_medida}
                      </td>

                      <td>
                        <strong>
                          {material.cantidad_sugerida} {material.unidad_medida}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            material.estado === 'Agotado'
                              ? 'estado-agotado'
                              : 'estado-bajo-stock'
                          }
                        >
                          {material.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="nota-compras">
            Las cantidades sugeridas corresponden a las unidades
            necesarias para alcanzar el stock mínimo.
          </p>
        </>
      )}
    </section>
  )
}

export default Compras
