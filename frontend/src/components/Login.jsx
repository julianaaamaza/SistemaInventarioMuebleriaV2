import { useState } from 'react'

function Login({ onLoginExitoso }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setMensaje('')
    setCargando(true)

    try {
      // Enviar las credenciales al backend
      const respuesta = await fetch(
        'https://inventario-muebleria-backend.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            correo,
            contrasena
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setMensaje(datos.mensaje || 'No se pudo iniciar sesión')
        return
      }

      if (!datos.sesion?.access_token) {
        setMensaje('No se recibió una sesión válida')
        return
      }

      // Limpiar la contraseña del formulario
      setContrasena('')

      // Informar a App.jsx que el login fue exitoso
      if (typeof onLoginExitoso === 'function') {
        onLoginExitoso({
          usuario: datos.usuario,
          token: datos.sesion.access_token
        })
      } else {
        setMensaje('Inicio de sesión correcto. ¡Bienvenida al sistema!')
      }

    } catch (error) {
      setMensaje('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="contenedor">
      <div className="bienvenida">
        <h1>Iniciar sesión</h1>
        <h2>Sistema de Inventario</h2>

        <p>Ingresa tus datos para acceder al sistema.</p>

        <form
          onSubmit={iniciarSesion}
          className="formulario-login"
        >
          <label htmlFor="correo">
            Correo electrónico
          </label>

          <input
            id="correo"
            type="email"
            placeholder="Ingresa tu correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="contrasena">
            Contraseña
          </label>

          <input
            id="contrasena"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>

          {mensaje && (
            <p role="status">{mensaje}</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login
