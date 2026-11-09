import { useEffect, useState } from 'react'
import Login from './components/Login'
import RecuperarContrasena from './components/RecuperarContrasena'
import Materiales from './components/Materiales'
import RegistrarEntrada from './components/RegistrarEntrada'
import RegistrarSalida from './components/RegistrarSalida'
import HistorialMovimientos from './components/HistorialMovimientos'
import Compras from './components/Compras'
import { supabase } from './lib/supabase'
import './App.css'

const opcionesMenu = [
  { id: 'inicio', nombre: '⌂  Inicio' },
  { id: 'inventario', nombre: '▣  Inventario' },
  { id: 'entrada', nombre: '↓  Registrar entrada' },
  { id: 'salida', nombre: '↑  Registrar salida' },
  { id: 'compras', nombre: '🛒  Compras' },
  { id: 'movimientos', nombre: '↺  Movimientos' }
]

function App() {
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [recuperando, setRecuperando] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  const [administrador, setAdministrador] = useState(null)
  const [token, setToken] = useState(null)
  const [comprobandoRol, setComprobandoRol] = useState(false)

  // Controlar la sección seleccionada del menú
  const [seccionActual, setSeccionActual] = useState('inicio')
  // Material seleccionado desde el panel de Inicio
const [materialSeleccionadoId, setMaterialSeleccionadoId] = useState(null)

  // Datos reales para el resumen de inicio
  const [resumen, setResumen] = useState(null)
  const [cargandoResumen, setCargandoResumen] = useState(false)
  const [errorResumen, setErrorResumen] = useState('')

  // Últimos movimientos para el panel de Inicio
const [movimientosRecientes, setMovimientosRecientes] = useState([])
const [cargandoMovimientos, setCargandoMovimientos] = useState(false)
const [errorMovimientos, setErrorMovimientos] = useState('')

  useEffect(() => {
    let activo = true

    const hash = new URLSearchParams(
      window.location.hash.replace(/^#/, '')
    )

    const query = new URLSearchParams(window.location.search)

    const esRecuperacion =
      hash.get('type') === 'recovery' ||
      query.get('type') === 'recovery'

    const errorEnlace =
      hash.get('error') || query.get('error')

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((evento) => {
        if (!activo) return

        if (evento === 'PASSWORD_RECOVERY') {
          setRecuperando(true)
          setMostrarLogin(false)
          setMensaje('')
          setVerificando(false)
        }
      })

    const revisarEnlace = async () => {
      if (errorEnlace) {
        if (!activo) return

        setMensaje(
          'El enlace de recuperación fue rechazado. Solicita uno nuevo.'
        )
        setMostrarLogin(true)
        setVerificando(false)
        return
      }

      const { data, error } = await supabase.auth.getSession()

      if (!activo) return

      if (error) {
        setMensaje(
          'No se pudo verificar la sesión de recuperación.'
        )
        setMostrarLogin(true)
      } else if (esRecuperacion && data.session) {
        setRecuperando(true)
      } else if (esRecuperacion && !data.session) {
        setMensaje(
          'No se pudo validar el enlace de recuperación.'
        )
        setMostrarLogin(true)
      }

      setVerificando(false)
    }

    revisarEnlace()

    return () => {
      activo = false
      subscription.unsubscribe()
    }
  }, [])

  // Comprobar el rol después de iniciar sesión
  const loginExitoso = async ({ token: tokenRecibido }) => {
    setComprobandoRol(true)
    setMensaje('')

    try {
      const respuesta = await fetch(
        'https://inventario-muebleria-backend.onrender.com/api/auth/perfil',
        {
          headers: {
            Authorization: `Bearer ${tokenRecibido}`
          }
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setMensaje(
          datos.mensaje || 'No se pudieron verificar tus permisos.'
        )
        return
      }

      if (!datos.usuario || !['administrador', 'encargado'].includes(datos.usuario.rol)) {
        setMensaje('El perfil no tiene un rol autorizado.')
        return
      }

      setToken(tokenRecibido)
      setAdministrador(datos.usuario)
      setSeccionActual('inicio')
      setMostrarLogin(false)

    } catch (error) {
      setMensaje('No se pudo conectar con el servidor.')
    } finally {
      setComprobandoRol(false)
    }
  }

  // Consultar los materiales para mostrar el resumen
  useEffect(() => {
    if (!token || !administrador || seccionActual !== 'inicio') {
      return
    }

    const controlador = new AbortController()

    const cargarResumen = async () => {
      setCargandoResumen(true)
      setErrorResumen('')

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
            datos.mensaje || 'No se pudo cargar el resumen'
          )
        }

        const materiales = datos.materiales || []

        const stockSuficiente = materiales.filter(
          (material) => material.cantidad > material.stock_minimo
        ).length

        const bajoStock = materiales.filter(
          (material) => material.cantidad <= material.stock_minimo
        ).length

        if (!controlador.signal.aborted) {
          setResumen({
            total: materiales.length,
            stockSuficiente,
            bajoStock,
            materialesAtencion: materiales.filter(
              (material) => material.cantidad <= material.stock_minimo
            )
          })
        }

      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorResumen(error.message)
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoResumen(false)
        }
      }
    }

    cargarResumen()

    return () => controlador.abort()
  }, [token, administrador, seccionActual])


  // Consultar los movimientos recientes para Inicio
  useEffect(() => {
    if (!token || !administrador || seccionActual !== 'inicio') {
      return
    }

    const controlador = new AbortController()

    const cargarMovimientosRecientes = async () => {
      setCargandoMovimientos(true)
      setErrorMovimientos('')

      try {
        const respuesta = await fetch(
          'https://inventario-muebleria-backend.onrender.com/api/movimientos',
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
            datos.mensaje || 'No se pudieron cargar los movimientos'
          )
        }

        if (!controlador.signal.aborted) {
          setMovimientosRecientes(
            (datos.movimientos || []).slice(0, 5)
          )
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorMovimientos(error.message)
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargandoMovimientos(false)
        }
      }
    }

    cargarMovimientosRecientes()

    return () => controlador.abort()
  }, [token, administrador, seccionActual])

  // Cerrar sesión
  const cerrarSesion = async () => {
    setToken(null)
    setAdministrador(null)
    setMaterialSeleccionadoId(null)
    setMovimientosRecientes([])
    setResumen(null)
    setMensaje('')
    setSeccionActual('inicio')
    setMostrarLogin(true)

    await supabase.auth.signOut()
  }

  // Cambiar contraseña desde un enlace de recuperación
  const cambiarContrasena = async (nuevaContrasena) => {
    const { data, error: errorSesion } =
      await supabase.auth.getSession()

    if (errorSesion || !data.session) {
      throw new Error(
        'No hay una sesión válida para cambiar la contraseña.'
      )
    }

    const { error } = await supabase.auth.updateUser({
      password: nuevaContrasena
    })

    if (error) {
      throw new Error(error.message)
    }

    await supabase.auth.signOut()

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    )

    setRecuperando(false)
    setMostrarLogin(true)
    setMensaje(
      '¡Contraseña actualizada! Ya puedes iniciar sesión.'
    )
  }

  if (verificando) {
    return (
      <div className="contenedor">
        <div className="bienvenida">
          <p>Verificando enlace de recuperación...</p>
        </div>
      </div>
    )
  }

  if (recuperando) {
    return (
      <RecuperarContrasena
        onCambiarContrasena={cambiarContrasena}
      />
    )
  }

  // Panel de administración con menú lateral
  if (administrador && token) {
    return (
      <div className="panel-admin">

        {/* MENÚ LATERAL */}
        <aside className="menu-lateral">

          <div className="marca-muebleria">
            <h2>Muebles a medida Jose Fernandez</h2>
            <p>Sistema de Inventario</p>
          </div>

          <nav className="navegacion-admin">
            {opcionesMenu.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={
                  seccionActual === opcion.id
                    ? 'boton-menu activo'
                    : 'boton-menu'
                }
                onClick={() => setSeccionActual(opcion.id)}
              >
                {opcion.nombre}
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="boton-cerrar"
            onClick={cerrarSesion}
          >
            ↪ Cerrar sesión
          </button>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="contenido-admin">

          {/* INICIO */}
          {seccionActual === 'inicio' && (
            <>
              <header className="encabezado-admin">
                <span className="etiqueta-sistema">
                  Sistema de Inventario
                </span>

                <h1>{administrador.rol === 'administrador' ? '¡Bienvenida' : '¡Bienvenido'}, {administrador.nombre}!</h1>

                <p>
                  Aquí puedes revisar el estado general
                  de los materiales de la mueblería.
                </p>
              </header>

              {cargandoResumen && (
                <p>Cargando resumen del inventario...</p>
              )}

              {errorResumen && (
                <p role="alert">{errorResumen}</p>
              )}

              {resumen && !cargandoResumen && (
                <>
                  <div className="resumen-inventario">

                    <div className="tarjeta-admin">
                      <h3>Total de materiales</h3>
                      <h2>{resumen.total}</h2>
                    </div>

                    <div className="tarjeta-admin">
                      <h3>Stock suficiente</h3>
                      <h2>{resumen.stockSuficiente}</h2>
                    </div>

                    <div className="tarjeta-admin">
                      <h3>Bajo stock o agotados</h3>
                      <h2>{resumen.bajoStock}</h2>
                    </div>

                  </div>

                  <div className="panel-detalles-inicio">
<section className="tarjeta-admin seccion-atencion">
  <div className="encabezado-atencion">
    <h2>Materiales que necesitan atención</h2>

    <button
      type="button"
      className="enlace-inventario"
      onClick={() => setSeccionActual('inventario')}
    >
      Ver inventario
    </button>
  </div>

  {resumen.materialesAtencion.length === 0 ? (
    <p>¡Todo bien! No hay materiales con stock bajo.</p>
  ) : (
    <div className="lista-materiales-atencion">
      {resumen.materialesAtencion.map((material) => (
        <div className="material-atencion" key={material.id}>
          <div className="informacion-material-atencion">
            <h3>{material.nombre}</h3>

            <p>
              {material.categoria || 'Sin categoría'}
              {' · '}
              Stock: {material.cantidad}
              {' · '}
              Mínimo: {material.stock_minimo}
            </p>
          </div>

          <div className="acciones-material-atencion">
            <span className="etiqueta-stock-bajo">
              {material.cantidad === 0
                ? 'Agotado'
                : 'Bajo stock'}
            </span>

            <button
  type="button"
  className="boton-ver-material"
  onClick={() => {
    setMaterialSeleccionadoId(material.id)
    setSeccionActual('inventario')
  }}
>
  Ver material
</button>
          </div>
        </div>
      ))}
    </div>
  )}
</section>

                  <section className="tarjeta-admin seccion-recientes">
                    <div className="encabezado-recientes">
                      <h2>Movimientos recientes</h2>
                      <button
                        type="button"
                        className="enlace-movimientos"
                        onClick={() => setSeccionActual('movimientos')}
                      >
                        Ver historial
                      </button>
                    </div>

                    {cargandoMovimientos && <p>Cargando movimientos...</p>}
                    {errorMovimientos && <p role="alert">{errorMovimientos}</p>}
                    {!cargandoMovimientos && !errorMovimientos && movimientosRecientes.length === 0 && (
                      <p>No hay movimientos registrados.</p>
                    )}
                    {!cargandoMovimientos && !errorMovimientos && movimientosRecientes.length > 0 && (
                      <div className="lista-movimientos-recientes">
                        {movimientosRecientes.map((movimiento) => (
                          <div className="movimiento-reciente" key={movimiento.id}>
                            <div className="informacion-movimiento-reciente">
                              <h3>{movimiento.material_nombre}</h3>
                              <p>{movimiento.created_at && !Number.isNaN(new Date(movimiento.created_at).getTime())
                                ? new Date(movimiento.created_at).toLocaleDateString('es-CL', {
                                    timeZone: 'America/Santiago',
                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                  })
                                : 'Sin fecha'}</p>
                            </div>
                            <span className={movimiento.tipo === 'entrada' ? 'movimiento-positivo' : 'movimiento-negativo'}>
                              {movimiento.tipo === 'entrada' ? '+' : '-'}{movimiento.cantidad}
                              {' · '}{movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                  </div>
                </>
              )}
            </>
          )}

          {/* INVENTARIO */}
          {seccionActual === 'inventario' && (
            <>
              <header className="encabezado-admin">
                <span className="etiqueta-sistema">
                  Sistema de Inventario
                </span>
              </header>

              <Materiales
  token={token}
  materialSeleccionadoId={materialSeleccionadoId}
  rol={administrador.rol}
/>
            </>
          )}

          {/* REGISTRAR ENTRADA */}
          {seccionActual === 'entrada' && (
            <section className="tarjeta-admin">
              <RegistrarEntrada token={token} />
            </section>
          )}

          {/* REGISTRAR SALIDA */}
          {seccionActual === 'salida' && (
            <section className="tarjeta-admin">
              <RegistrarSalida token={token} />
            </section>
          )}

          {seccionActual === 'compras' && (
  <section className="tarjeta-admin">
    <Compras token={token} />
  </section>
)}

          {seccionActual === 'movimientos' && (
  <section className="tarjeta-admin">
    <HistorialMovimientos token={token} />
  </section>
)}

        </main>
      </div>
    )
  }

  // Pantalla de inicio de sesión
  if (mostrarLogin) {
    return (
      <>
        {mensaje && <p role="status">{mensaje}</p>}

        {comprobandoRol ? (
          <div className="contenedor">
            <div className="bienvenida">
              <p>Verificando permisos del usuario...</p>
            </div>
          </div>
        ) : (
          <Login onLoginExitoso={loginExitoso} />
        )}
      </>
    )
  }

  // Pantalla de bienvenida
  return (
    <div className="contenedor">
      <div className="bienvenida">
        <h1>Muebles a medida Jose Fernandez</h1>
        <h2>Sistema de Inventario</h2>

        <p>
          Bienvenido al sistema de gestión de materiales.
          Aquí podrás controlar el inventario, registrar
          entradas y salidas y revisar las alertas de stock.
        </p>

        <button onClick={() => setMostrarLogin(true)}>
          Ingresar al sistema
        </button>
      </div>
    </div>
  )
}

export default App
