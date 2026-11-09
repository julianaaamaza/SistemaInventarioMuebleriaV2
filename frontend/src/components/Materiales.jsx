import { useEffect, useState } from 'react'

const formularioInicial = {
  codigo: '',
  nombre: '',
  categoria: '',
  unidad_medida: 'unidades',
  cantidad: '0',
  stock_minimo: '0',
  descripcion: ''
}

function Materiales({ token, rol, materialSeleccionadoId = null }) {
  const esAdministrador = rol === 'administrador'
  const [materiales, setMateriales] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [materialEditando, setMaterialEditando] = useState(null)
  const [formulario, setFormulario] = useState({ ...formularioInicial })
  const [busqueda, setBusqueda] = useState('')

  const [filtroCategoria, setFiltroCategoria] = useState('todas')
const [filtroEstado, setFiltroEstado] = useState('todos')
const [orden, setOrden] = useState('nombre')


  // Obtener materiales desde el backend
  const obtenerMateriales = async (signal) => {
    const respuesta = await fetch(
      'http://localhost:3000/api/materiales',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal
      }
    )

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje || 'No se pudieron consultar los materiales'
      )
    }

    if (!signal?.aborted) {
      setMateriales(datos.materiales || [])
    }
  }

  useEffect(() => {
    const controlador = new AbortController()

    const cargar = async () => {
      setCargando(true)
      setError('')

      try {
        await obtenerMateriales(controlador.signal)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError(error.message)
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false)
        }
      }
    }

    if (token) {
      cargar()
    } else {
      setCargando(false)
      setError('Debes iniciar sesión')
    }

    return () => controlador.abort()
  }, [token])

  // Cerrar el formulario
  const cerrarModal = () => {
    if (guardando) return

    setModalAbierto(false)
    setMaterialEditando(null)
    setFormulario({ ...formularioInicial })
    setError('')
  }

  // Abrir el formulario para registrar
  const abrirRegistro = () => {
    if (!esAdministrador) return
    setError('')
    setMensaje('')
    setMaterialEditando(null)
    setFormulario({ ...formularioInicial })
    setModalAbierto(true)
  }

  // Abrir el formulario con los datos existentes
  const abrirEdicion = (material) => {
    setError('')
    setMensaje('')
    setMaterialEditando(material)
    setFormulario({
      codigo: material.codigo || '',
      nombre: material.nombre || '',
      categoria: material.categoria || '',
      unidad_medida: material.unidad_medida || 'unidades',
      cantidad: String(material.cantidad),
      stock_minimo: String(material.stock_minimo),
      descripcion: material.descripcion || ''
    })
    setModalAbierto(true)
  }

  // Abrir automáticamente el material elegido desde Inicio.
  // Se espera a que termine la consulta al backend.
  useEffect(() => {
    if (cargando || materialSeleccionadoId == null) return

    const seleccionado = materiales.find(
      (material) => String(material.id) === String(materialSeleccionadoId)
    )

    if (!seleccionado) {
      setError('No se encontró el material seleccionado.')
      return
    }

    // Restablecer filtros para que el material también sea visible en la tabla.
    setBusqueda(seleccionado.nombre || '')
    setFiltroCategoria('todas')
    setFiltroEstado('todos')
    abrirEdicion(seleccionado)
    // Se ejecuta al recibir el material solicitado y terminar de cargarlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialSeleccionadoId, cargando])

  // Actualizar campos
  const actualizarCampo = (e) => {
    const { name, value } = e.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }

  // Registrar nuevo material
  const guardarMaterial = async (e) => {
    e.preventDefault()
    if (!esAdministrador) {
      setError('No tienes permisos para modificar materiales')
      return
    }
    setError('')
    setMensaje('')

    const cantidad = Number(formulario.cantidad)
    const stockMinimo = Number(formulario.stock_minimo)
    const editando = materialEditando !== null

    if (
      (!editando && formulario.cantidad.trim() === '') ||
      formulario.stock_minimo.trim() === '' ||
      (!editando && (!Number.isInteger(cantidad) || cantidad < 0)) ||
      !Number.isInteger(stockMinimo) ||
      stockMinimo < 0
    ) {
      setError(
        'La cantidad y el stock mínimo deben ser números enteros mayores o iguales a cero.'
      )
      return
    }

    setGuardando(true)

    try {
      const respuesta = await fetch(
        editando
          ? `http://localhost:3000/api/materiales/${materialEditando.id}`
          : 'http://localhost:3000/api/materiales',
        {
          method: editando ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            codigo: formulario.codigo.trim().toUpperCase(),
            nombre: formulario.nombre.trim(),
            categoria: formulario.categoria.trim(),
            unidad_medida: formulario.unidad_medida,
            ...(!editando ? { cantidad } : {}),
            stock_minimo: stockMinimo,
            descripcion: formulario.descripcion.trim()
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || (editando ? 'No se pudo actualizar el material' : 'No se pudo registrar el material')
        )
      }

      // Actualizar la lista sin duplicar el material editado
      setMateriales((anteriores) => {
        const lista = editando
          ? anteriores.map((item) =>
              item.id === materialEditando.id ? { ...item, ...datos.material } : item
            )
          : [...anteriores, datos.material]

        return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      })

      setMensaje(editando
        ? '¡Material actualizado correctamente!'
        : '¡Material registrado correctamente!')
      setModalAbierto(false)
      setMaterialEditando(null)
      setFormulario({ ...formularioInicial })

    } catch (error) {
      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

  // Desactivar o reactivar sin borrar el material
  const cambiarEstadoMaterial = async (material) => {
    if (!esAdministrador) return
    const nuevoEstado = material.activo === false
    const accion = nuevoEstado ? 'reactivar' : 'desactivar'

    if (!window.confirm(`¿Quieres ${accion} el material "${material.nombre}"?`)) {
      return
    }

    setError('')
    setMensaje('')
    setCambiandoEstadoId(material.id)

    try {
      const respuesta = await fetch(
        `http://localhost:3000/api/materiales/${material.id}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ activo: nuevoEstado })
        }
      )
      const datos = await respuesta.json()
      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'No se pudo cambiar el estado')
      }

      setMateriales((anteriores) => anteriores.map((item) =>
        item.id === material.id ? { ...item, ...datos.material } : item
      ))
      setMensaje(datos.mensaje || 'Estado actualizado correctamente')
    } catch (error) {
      setError(error.message)
    } finally {
      setCambiandoEstadoId(null)
    }
  }

  // Estado del stock
  const obtenerEstado = (material) => {
    if (material.activo === false) return 'Inactivo'
    if (material.cantidad === 0) return 'Agotado'
    if (material.cantidad <= material.stock_minimo) return 'Bajo stock'
    return 'Stock suficiente'
  }

  
  // Obtener categorías desde los materiales registrados
  const categorias = [
    ...new Set(
      materiales
        .map((material) => material.categoria?.trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, 'es'))

  // Aplicar búsqueda, filtros y orden
  const materialesFiltrados = materiales
    .filter((material) => {
      const texto = busqueda.trim().toLowerCase()

      const coincideBusqueda =
        (material.nombre || '').toLowerCase().includes(texto) ||
        (material.codigo || '').toLowerCase().includes(texto)

      const coincideCategoria =
        filtroCategoria === 'todas' ||
        (filtroCategoria === 'sin-categoria'
          ? !material.categoria?.trim()
          : material.categoria === filtroCategoria)

      const estado = obtenerEstado(material)

      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'suficiente' && estado === 'Stock suficiente') ||
        (filtroEstado === 'bajo' && estado === 'Bajo stock') ||
        (filtroEstado === 'agotado' && estado === 'Agotado') ||
        (filtroEstado === 'inactivo' && estado === 'Inactivo')

      return coincideBusqueda && coincideCategoria && coincideEstado
    })
    .sort((a, b) => {
      if (orden === 'nombre') {
        return a.nombre.localeCompare(b.nombre, 'es')
      }

      if (orden === 'nombre-desc') {
        return b.nombre.localeCompare(a.nombre, 'es')
      }

      if (orden === 'cantidad-menor') {
        return a.cantidad - b.cantidad
      }

      if (orden === 'cantidad-mayor') {
        return b.cantidad - a.cantidad
      }

      return 0
    })


  return (
    <section className="seccion-materiales">

      {/* Encabezado */}
      <div className="encabezado-inventario">
        <div>
          <h2>Inventario de materiales</h2>
          <p>{materiales.length} materiales registrados</p>
        </div>

        {esAdministrador && (
          <button
            type="button"
            className="boton-registrar-material"
            onClick={abrirRegistro}
          >
            + Registrar material
          </button>
        )}
      </div>

      
      {/* Barra de búsqueda y filtros */}
      <div className="barra-inventario filtros-inventario">

        <input
          type="search"
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar materiales"
        />

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="todas">Todas las categorías</option>

          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}

          {materiales.some((material) => !material.categoria?.trim()) && (
            <option value="sin-categoria">Sin categoría</option>
          )}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos los estados</option>
          <option value="suficiente">Stock suficiente</option>
          <option value="bajo">Bajo stock</option>
          <option value="agotado">Agotados</option>
          <option value="inactivo">Inactivos</option>
        </select>

        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          aria-label="Ordenar materiales"
        >
          <option value="nombre">Ordenar por nombre (A-Z)</option>
          <option value="nombre-desc">Ordenar por nombre (Z-A)</option>
          <option value="cantidad-menor">Menor cantidad primero</option>
          <option value="cantidad-mayor">Mayor cantidad primero</option>
        </select>

      </div>


      {mensaje && <p role="status">{mensaje}</p>}
      {!modalAbierto && error && <p role="alert">{error}</p>}

      {/* Tabla */}
      {cargando ? (
        <p>Cargando materiales...</p>
      ) : materialesFiltrados.length === 0 ? (
        <p>
          {materiales.length === 0
            ? 'Todavía no hay materiales registrados.'
            : 'No se encontraron materiales con esa búsqueda.'}
        </p>
      ) : (
        <div className="tabla-inventario">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Material</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {materialesFiltrados.map((material) => {
                const estado = obtenerEstado(material)

                return (
                  <tr key={material.id}>
                    <td>{material.codigo || 'Sin código'}</td>
                    <td><strong>{material.nombre}</strong></td>
                    <td>{material.categoria || 'Sin categoría'}</td>
                    <td>{material.unidad_medida}</td>
                    <td>{material.cantidad}</td>
                    <td>{material.stock_minimo}</td>
                    <td>
                      <span
                        className={
                          estado === 'Inactivo'
                            ? 'estado-stock inactivo'
                            : estado === 'Stock suficiente'
                            ? 'estado-stock suficiente'
                            : 'estado-stock bajo'
                        }
                      >
                        {estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="boton-editar-material"
                        onClick={() => abrirEdicion(material)}
                        disabled={cambiandoEstadoId === material.id}
                      >
                          {esAdministrador ? 'Ver / editar' : 'Ver material'}
                      </button>
                      {' '}
                      {esAdministrador && (
                        <button
                          type="button"
                          className="boton-estado-material"
                          onClick={() => cambiarEstadoMaterial(material)}
                          disabled={cambiandoEstadoId !== null || !token}
                        >
                          {cambiandoEstadoId === material.id
                            ? 'Guardando...'
                            : material.activo === false ? 'Reactivar' : 'Desactivar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ventana emergente */}
      {modalAbierto && (
        <div
          className="fondo-modal"
          onClick={cerrarModal}
        >
          <div
            className="ventana-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-material"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="encabezado-modal">
              <h2 id="titulo-modal-material">
                {materialEditando ? (esAdministrador ? 'Ver / editar material' : 'Ver material') : 'Registrar nuevo material'}
              </h2>

              <button
                type="button"
                className="cerrar-modal"
                onClick={cerrarModal}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={guardarMaterial}
              className="formulario-material"
            >
              <fieldset
                disabled={!esAdministrador}
                style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}
              >
              <div className="campos-material">
                <div className="campo-material">
                  <label htmlFor="codigo">Código del material *</label>
                  <input
                    id="codigo"
                    name="codigo"
                    placeholder="Ej: MAD-PIN-001"
                    value={formulario.codigo}
                    onChange={actualizarCampo}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="campo-material">
                  <label htmlFor="nombre">Nombre del material *</label>
                  <input
                    id="nombre"
                    name="nombre"
                    placeholder="Ej: Madera de pino"
                    value={formulario.nombre}
                    onChange={actualizarCampo}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="campo-material">
                  <label htmlFor="categoria">Categoría *</label>
                  <input
                    id="categoria"
                    name="categoria"
                    placeholder="Ej: Maderas"
                    value={formulario.categoria}
                    onChange={actualizarCampo}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="campo-material">
                  <label htmlFor="unidad_medida">Unidad de medida *</label>
                  <select
                    id="unidad_medida"
                    name="unidad_medida"
                    value={formulario.unidad_medida}
                    onChange={actualizarCampo}
                    required
                  >
                    <option value="unidades">Unidades</option>
                    <option value="metros">Metros</option>
                    <option value="kilos">Kilos</option>
                    <option value="litros">Litros</option>
                    <option value="planchas">Planchas</option>
                  </select>
                </div>

                {!materialEditando && <div className="campo-material">
                  <label htmlFor="cantidad">Cantidad inicial *</label>
                  <input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.cantidad}
                    onChange={actualizarCampo}
                    required
                  />
                </div>}

                <div className="campo-material">
                  <label htmlFor="stock_minimo">Stock mínimo *</label>
                  <input
                    id="stock_minimo"
                    name="stock_minimo"
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.stock_minimo}
                    onChange={actualizarCampo}
                    required
                  />
                </div>

                <div className="campo-material campo-completo">
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    rows={3}
                    value={formulario.descripcion}
                    onChange={actualizarCampo}
                    maxLength={500}
                    placeholder="Descripción del material"
                  />
                </div>
              </div>
              </fieldset>

              {materialEditando && (
                <p className="aviso-stock-edicion">
                  Stock actual: <strong>{materialEditando.cantidad} {materialEditando.unidad_medida}</strong>.
                  La cantidad se cambiará desde Registrar entrada o Registrar salida.
                </p>
              )}

              {error && <p role="alert">{error}</p>}

              <div className="acciones-modal">
                <button
                  type="button"
                  className="boton-cancelar"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  {esAdministrador ? 'Cancelar' : 'Cerrar'}
                </button>

                {esAdministrador && (
                  <button
                    type="submit"
                    className="boton-guardar"
                    disabled={guardando || !token}
                  >
                    {guardando
                      ? 'Guardando...'
                      : materialEditando ? 'Guardar cambios' : 'Guardar material'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default Materiales
