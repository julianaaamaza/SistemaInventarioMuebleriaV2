import { useState } from 'react'

function RecuperarContrasena({ onCambiarContrasena }) {
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const cambiarContrasena = async (e) => {
    e.preventDefault()

    if (contrasena.length < 8) {
      setMensaje('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (contrasena !== confirmacion) {
      setMensaje('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    setMensaje('')

    try {
      await onCambiarContrasena(contrasena)
      setMensaje('¡Contraseña actualizada correctamente!')
    } catch (error) {
      setMensaje(error.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="contenedor">
      <div className="bienvenida">
        <h1>Recuperar contraseña</h1>
        <h2>Sistema de Inventario</h2>

        <p>Ingresa tu nueva contraseña para continuar.</p>

        <form onSubmit={cambiarContrasena} className="formulario-login">
          <label htmlFor="nuevaContrasena">
            Nueva contraseña
          </label>
          <input
            id="nuevaContrasena"
            type="password"
            placeholder="Ingresa tu nueva contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="new-password"
            required
          />

          <label htmlFor="confirmarContrasena">
            Confirmar contraseña
          </label>
          <input
            id="confirmarContrasena"
            type="password"
            placeholder="Repite tu nueva contraseña"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            autoComplete="new-password"
            required
          />

          <button type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Cambiar contraseña'}
          </button>

          {mensaje && <p role="status">{mensaje}</p>}
        </form>
      </div>
    </div>
  )
}

export default RecuperarContrasena
