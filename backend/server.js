const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Falta configurar Supabase en .env");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Permitir solicitudes desde React
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ]
}));

app.use(express.json({ limit: "10kb" }));

// Crear un cliente Supabase con el token del usuario
function crearClienteUsuario(token) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// Verificar que el usuario inició sesión
async function verificarUsuario(req, res, next) {
  try {
    const autorizacion = req.headers.authorization || "";

    if (!autorizacion.startsWith("Bearer ")) {
      return res.status(401).json({
        mensaje: "Debes iniciar sesión"
      });
    }

    const token = autorizacion.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        mensaje: "Token no válido"
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        mensaje: "Sesión inválida o expirada"
      });
    }

    req.usuario = data.user;
    req.supabaseUsuario = crearClienteUsuario(token);

    next();

  } catch (error) {
    console.error("Error de autenticación:", error.message);

    res.status(500).json({
      mensaje: "Error al verificar la sesión"
    });
  }
}

// Verificar el rol del usuario
async function verificarRol(req, res, next) {
  try {
    const { data: perfil, error } =
      await req.supabaseUsuario
        .from("perfiles")
        .select("nombre, rol")
        .eq("id", req.usuario.id)
        .single();

    if (error) {
      console.error("Error consultando perfil:", {
        codigo: error.code,
        mensaje: error.message
      });

      return res.status(500).json({
        mensaje: "No se pudo consultar el perfil"
      });
    }

    if (!perfil) {
      return res.status(403).json({
        mensaje: "No tienes un perfil autorizado"
      });
    }

    req.perfil = perfil;

    next();

  } catch (error) {
    console.error("Error verificando rol:", error.message);

    res.status(500).json({
      mensaje: "Error al verificar los permisos"
    });
  }
}

// 1. Comprobar el servidor
app.get("/", (req, res) => {
  res.json({
    mensaje: "Servidor del Sistema de Inventario funcionando"
  });
});

// 2. Comprobar la configuración de Supabase
app.get("/api/conexion", (req, res) => {
  res.json({
    mensaje: "Configuración de Supabase cargada correctamente",
    clienteConfigurado: Boolean(supabase)
  });
});

// 3. Iniciar sesión
app.post("/api/auth/login", async (req, res) => {
  try {
    const { correo, contrasena } = req.body || {};

    if (
      typeof correo !== "string" ||
      typeof contrasena !== "string" ||
      !correo.trim() ||
      !contrasena
    ) {
      return res.status(400).json({
        mensaje: "Debes ingresar correo y contraseña"
      });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contrasena
      });

    if (error || !data.user || !data.session) {
      return res.status(401).json({
        mensaje: "No se pudo iniciar sesión. Verifica tus datos."
      });
    }

    res.json({
      mensaje: "Inicio de sesión correcto",
      usuario: {
        id: data.user.id,
        correo: data.user.email
      },
      sesion: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error("Error de login:", error.message);

    res.status(500).json({
      mensaje: "Error al iniciar sesión"
    });
  }
});

// 4. Verificar administrador
app.get(
  "/api/auth/administrador",
  verificarUsuario,
  verificarRol,
  (req, res) => {
    if (req.perfil.rol !== "administrador") {
      return res.status(403).json({
        mensaje: "No tienes permisos de administrador"
      });
    }

    res.json({
      mensaje: "Administrador verificado correctamente",
      usuario: {
        id: req.usuario.id,
        nombre: req.perfil.nombre,
        rol: req.perfil.rol
      }
    });
  }
);


/* ==========================================
   VERIFICAR PERFIL DEL USUARIO
   Administrador o Encargado
========================================== */

app.get(
  "/api/auth/perfil",
  verificarUsuario,
  verificarRol,
  (req, res) => {
    const { nombre, rol } = req.perfil;

    // Permitir únicamente los roles del sistema
    if (!["administrador", "encargado"].includes(rol)) {
      return res.status(403).json({
        mensaje: "No tienes permisos para ingresar al sistema"
      });
    }

    return res.status(200).json({
      mensaje: "Perfil verificado correctamente",
      usuario: {
        id: req.usuario.id,
        nombre,
        rol
      }
    });
  }
);



// 5. Consultar materiales del inventario
app.get(
  "/api/materiales",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      if (
        !["administrador", "encargado"].includes(req.perfil.rol)
      ) {
        return res.status(403).json({
          mensaje: "No tienes permisos para consultar materiales"
        });
      }

      const { data: materiales, error } =
        await req.supabaseUsuario
          .from("materiales")
          .select(
  "id, codigo, nombre, categoria, descripcion, cantidad, stock_minimo, unidad_medida, activo"
)
          .order("nombre", { ascending: true });

      if (error) {
        console.error("Error consultando materiales:", {
          codigo: error.code,
          mensaje: error.message
        });

        return res.status(500).json({
          mensaje: "No se pudieron consultar los materiales"
        });
      }

      res.json({
        mensaje: "Materiales consultados correctamente",
        materiales: materiales || []
      });

    } catch (error) {
      console.error(
        "Error inesperado al consultar materiales:",
        error.message
      );

      res.status(500).json({
        mensaje: "Error al consultar el inventario"
      });
    }
  }
);

// 6. Registrar un nuevo material
app.post(
  "/api/materiales",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      // Solo los administradores pueden registrar materiales
      if (req.perfil.rol !== "administrador") {
        return res.status(403).json({
          mensaje: "No tienes permisos para registrar materiales"
        });
      }

      const {
        codigo,
        nombre,
        categoria,
        descripcion,
        cantidad,
        stock_minimo,
        unidad_medida
      } = req.body || {};

      // Validar código, nombre, categoría y unidad
      if (
        typeof codigo !== "string" ||
        !codigo.trim() ||
        codigo.trim().length > 50 ||
        typeof nombre !== "string" ||
        !nombre.trim() ||
        nombre.trim().length > 100 ||
        typeof categoria !== "string" ||
        !categoria.trim() ||
        categoria.trim().length > 100 ||
        typeof unidad_medida !== "string" ||
        !unidad_medida.trim()
      ) {
        return res.status(400).json({
          mensaje: "Completa correctamente el código, nombre, categoría y unidad de medida"
        });
      }

      // Validar la descripción
      if (
        descripcion !== undefined &&
        descripcion !== null &&
        (
          typeof descripcion !== "string" ||
          descripcion.length > 500
        )
      ) {
        return res.status(400).json({
          mensaje: "La descripción no es válida"
        });
      }

      // Validar cantidades
      if (
        !Number.isSafeInteger(cantidad) ||
        cantidad < 0 ||
        cantidad > 2147483647 ||
        !Number.isSafeInteger(stock_minimo) ||
        stock_minimo < 0 ||
        stock_minimo > 2147483647
      ) {
        return res.status(400).json({
          mensaje: "La cantidad y el stock mínimo deben ser números enteros válidos mayores o iguales a cero"
        });
      }

      // Guardar el material en Supabase
      const { data: material, error } =
        await req.supabaseUsuario
          .from("materiales")
          .insert({
            codigo: codigo.trim().toUpperCase(),
            nombre: nombre.trim(),
            categoria: categoria.trim(),
            descripcion: descripcion?.trim() || null,
            cantidad,
            stock_minimo,
            unidad_medida: unidad_medida.trim()
          })
          .select(
            "id, codigo, nombre, categoria, descripcion, cantidad, stock_minimo, unidad_medida"
          )
          .single();

      if (error) {
        console.error("Error registrando material:", {
          codigo: error.code,
          mensaje: error.message
        });

        // Código duplicado
        if (error.code === "23505") {
          return res.status(409).json({
            mensaje: "Ya existe un material con ese código"
          });
        }

        return res.status(500).json({
          mensaje: "No se pudo registrar el material"
        });
      }

      res.status(201).json({
        mensaje: "Material registrado correctamente",
        material
      });

    } catch (error) {
      console.error(
        "Error inesperado al registrar material:",
        error.message
      );

      res.status(500).json({
        mensaje: "Error al registrar el material"
      });
    }
  }
);


/* ==========================================
   7. ACTUALIZAR UN MATERIAL (UPDATE)
========================================== */

app.put(
  "/api/materiales/:id",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      // Solo el administrador puede editar materiales
      if (req.perfil.rol !== "administrador") {
        return res.status(403).json({
          mensaje: "No tienes permisos para editar materiales"
        });
      }

      // Identificar el material que queremos editar
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "El ID del material no es válido"
        });
      }

      const {
        codigo,
        nombre,
        categoria,
        descripcion,
        stock_minimo,
        unidad_medida
      } = req.body || {};

      // Validar campos obligatorios
      if (
        typeof codigo !== "string" ||
        !codigo.trim() ||
        codigo.trim().length > 50 ||
        typeof nombre !== "string" ||
        !nombre.trim() ||
        nombre.trim().length > 100 ||
        typeof categoria !== "string" ||
        !categoria.trim() ||
        categoria.trim().length > 100 ||
        typeof unidad_medida !== "string" ||
        !unidad_medida.trim()
      ) {
        return res.status(400).json({
          mensaje: "Completa correctamente el código, nombre, categoría y unidad de medida"
        });
      }

      // Validar descripción
      if (
        descripcion !== undefined &&
        descripcion !== null &&
        (
          typeof descripcion !== "string" ||
          descripcion.length > 500
        )
      ) {
        return res.status(400).json({
          mensaje: "La descripción no es válida"
        });
      }

      // Validar stock mínimo
      if (
        !Number.isSafeInteger(stock_minimo) ||
        stock_minimo < 0 ||
        stock_minimo > 2147483647
      ) {
        return res.status(400).json({
          mensaje: "El stock mínimo debe ser un número entero válido mayor o igual a cero"
        });
      }

      // Actualizar solamente los datos permitidos
      const { data: material, error } =
        await req.supabaseUsuario
          .from("materiales")
          .update({
            codigo: codigo.trim().toUpperCase(),
            nombre: nombre.trim(),
            categoria: categoria.trim(),
            descripcion: descripcion?.trim() || null,
            stock_minimo,
            unidad_medida: unidad_medida.trim()
          })
          .eq("id", id)
          .select(
            "id, codigo, nombre, categoria, descripcion, cantidad, stock_minimo, unidad_medida"
          )
          .maybeSingle();

      if (error) {
        console.error("Error actualizando material:", {
          codigo: error.code,
          mensaje: error.message
        });

        if (error.code === "23505") {
          return res.status(409).json({
            mensaje: "Ya existe otro material con ese código"
          });
        }

        return res.status(500).json({
          mensaje: "No se pudo actualizar el material"
        });
      }

      if (!material) {
        return res.status(404).json({
          mensaje: "No se encontró el material o no tienes acceso para editarlo"
        });
      }

      res.json({
        mensaje: "Material actualizado correctamente",
        material
      });

    } catch (error) {
      console.error(
        "Error inesperado al actualizar material:",
        error.message
      );

      res.status(500).json({
        mensaje: "Error al actualizar el material"
      });
    }
  }
);


/* ==========================================
   8. DESACTIVAR O REACTIVAR MATERIAL
========================================== */

app.patch(
  "/api/materiales/:id/estado",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      // Solo el administrador puede cambiar el estado
      if (req.perfil.rol !== "administrador") {
        return res.status(403).json({
          mensaje: "No tienes permisos para cambiar el estado del material"
        });
      }

      const id = Number(req.params.id);
      const { activo } = req.body || {};

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          mensaje: "El ID del material no es válido"
        });
      }

      if (typeof activo !== "boolean") {
        return res.status(400).json({
          mensaje: "El estado debe ser verdadero o falso"
        });
      }

      // Actualizar únicamente el estado del material
      const { data: material, error } =
        await req.supabaseUsuario
          .from("materiales")
          .update({ activo })
          .eq("id", id)
          .select(
            "id, codigo, nombre, categoria, cantidad, stock_minimo, unidad_medida, activo"
          )
          .maybeSingle();

      if (error) {
        console.error("Error cambiando estado:", {
          codigo: error.code,
          mensaje: error.message
        });

        return res.status(500).json({
          mensaje: "No se pudo cambiar el estado del material"
        });
      }

      if (!material) {
        return res.status(404).json({
          mensaje: "No se encontró el material"
        });
      }

      res.json({
        mensaje: activo
          ? "Material reactivado correctamente"
          : "Material desactivado correctamente",
        material
      });

    } catch (error) {
      console.error("Error inesperado:", error.message);

      res.status(500).json({
        mensaje: "Error al cambiar el estado del material"
      });
    }
  }
);


/* ==========================================
   9. REGISTRAR ENTRADA DE MATERIALES
========================================== */

app.post(
  "/api/movimientos/entrada",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      // Administrador y encargado pueden registrar entradas
      if (!["administrador", "encargado"].includes(req.perfil.rol)) {
        return res.status(403).json({
          mensaje: "No tienes permisos para registrar entradas"
        });
      }

      const { material_id, cantidad, observacion } = req.body || {};

      if (
        !Number.isSafeInteger(material_id) ||
        material_id <= 0 ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0 ||
        cantidad > 2147483647
      ) {
        return res.status(400).json({
          mensaje: "Selecciona un material e ingresa una cantidad válida mayor que cero"
        });
      }

      if (
        observacion != null &&
        (typeof observacion !== "string" || observacion.length > 500)
      ) {
        return res.status(400).json({
          mensaje: "La observación no es válida"
        });
      }

      // Consultar el material
      const { data: material, error: errorMaterial } =
        await req.supabaseUsuario
          .from("materiales")
          .select("id, nombre, activo")
          .eq("id", material_id)
          .maybeSingle();

      if (errorMaterial) {
        console.error("Error consultando material:", errorMaterial.message);
        return res.status(500).json({
          mensaje: "No se pudo consultar el material"
        });
      }

      if (!material) {
        return res.status(404).json({
          mensaje: "El material no existe"
        });
      }

      if (!material.activo) {
        return res.status(400).json({
          mensaje: "No puedes registrar entradas de un material inactivo"
        });
      }

      // Registrar movimiento. El trigger de Supabase
      // se encarga de aumentar el stock.
      const { data: movimiento, error } =
        await req.supabaseUsuario
          .from("movimientos")
          .insert({
            material_id,
            tipo: "entrada",
            cantidad,
            observacion: observacion?.trim() || null
          })
          .select("id, material_id, tipo, cantidad, created_at, observacion")
          .single();

      if (error) {
        console.error("Error registrando entrada:", {
          codigo: error.code,
          mensaje: error.message
        });

        return res.status(500).json({
          mensaje: "No se pudo registrar la entrada"
        });
      }

      res.status(201).json({
        mensaje: "Entrada registrada correctamente",
        movimiento
      });

    } catch (error) {
      console.error("Error inesperado al registrar entrada:", error.message);

      res.status(500).json({
        mensaje: "Error al registrar la entrada"
      });
    }
  }
);


/* ==========================================
   10. REGISTRAR SALIDA DE MATERIALES
========================================== */

app.post(
  "/api/movimientos/salida",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      // Verificar permisos
      if (!["administrador", "encargado"].includes(req.perfil.rol)) {
        return res.status(403).json({
          mensaje: "No tienes permisos para registrar salidas"
        });
      }

      const { material_id, cantidad, observacion } = req.body || {};

      // Validar material y cantidad
      if (
        !Number.isSafeInteger(material_id) ||
        material_id <= 0 ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0 ||
        cantidad > 2147483647
      ) {
        return res.status(400).json({
          mensaje: "Selecciona un material y una cantidad válida"
        });
      }

      if (
        observacion != null &&
        (typeof observacion !== "string" || observacion.length > 500)
      ) {
        return res.status(400).json({
          mensaje: "La observación no es válida"
        });
      }

      // Consultar el material
      const { data: material, error: errorMaterial } =
        await req.supabaseUsuario
          .from("materiales")
          .select("id, nombre, cantidad, activo")
          .eq("id", material_id)
          .maybeSingle();

      if (errorMaterial) {
        return res.status(500).json({
          mensaje: "No se pudo consultar el material"
        });
      }

      if (!material) {
        return res.status(404).json({
          mensaje: "El material no existe"
        });
      }

      if (!material.activo) {
        return res.status(400).json({
          mensaje: "No puedes retirar materiales inactivos"
        });
      }

      // Comprobar stock disponible
      if (material.cantidad < cantidad) {
        return res.status(400).json({
          mensaje: "Stock insuficiente para registrar la salida"
        });
      }

      // Guardar el movimiento
      // El trigger descontará el stock automáticamente
      const { data: movimiento, error } =
        await req.supabaseUsuario
          .from("movimientos")
          .insert({
            material_id,
            tipo: "salida",
            cantidad,
            observacion: observacion?.trim() || null
          })
          .select("id, material_id, tipo, cantidad, created_at, observacion")
          .single();

      if (error) {
        console.error("Error registrando salida:", {
          codigo: error.code,
          mensaje: error.message
        });

        return res.status(400).json({
          mensaje: "No se pudo registrar la salida. Verifica el stock disponible y el estado del material."
        });
      }

      res.status(201).json({
        mensaje: "Salida registrada correctamente",
        movimiento
      });

    } catch (error) {
      console.error("Error inesperado al registrar salida:", error.message);

      res.status(500).json({
        mensaje: "Error al registrar la salida"
      });
    }
  }
);


/* ==========================================
   11. CONSULTAR HISTORIAL DE MOVIMIENTOS
========================================== */

app.get(
  "/api/movimientos",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      // Comprobar permisos
      if (
        !["administrador", "encargado"].includes(
          req.perfil.rol
        )
      ) {
        return res.status(403).json({
          mensaje: "No tienes permisos para ver los movimientos"
        });
      }

      // Consultar los movimientos en Supabase
      const { data: movimientos, error } =
        await req.supabaseUsuario
          .from("movimientos")
          .select(`
            id,
            material_id,
            tipo,
            cantidad,
            observacion,
            created_at
          `)
          .order("created_at", {
            ascending: false
          })
          .order("id", {
            ascending: false
          });

      if (error) {
        console.error(
          "Error consultando movimientos:",
          error.message
        );

        return res.status(500).json({
          mensaje: "No se pudo consultar el historial"
        });
      }

      // Consultar los nombres de los materiales
      const { data: materiales, error: errorMateriales } =
        await req.supabaseUsuario
          .from("materiales")
          .select("id, codigo, nombre");

      if (errorMateriales) {
        console.error(
          "Error consultando materiales:",
          errorMateriales.message
        );

        return res.status(500).json({
          mensaje: "No se pudieron consultar los materiales"
        });
      }

      // Relacionar cada movimiento con su material
      const materialesPorId = new Map(
        (materiales || []).map((material) => [
          material.id,
          material
        ])
      );

      const historial = (movimientos || []).map(
        (movimiento) => {
          const material = materialesPorId.get(
            movimiento.material_id
          );

          return {
            ...movimiento,
            material_nombre:
              material?.nombre || "Material no disponible",
            material_codigo:
              material?.codigo || "Sin código"
          };
        }
      );

      return res.status(200).json({
        mensaje: "Historial consultado correctamente",
        movimientos: historial
      });

    } catch (error) {
      console.error(
        "Error inesperado al consultar movimientos:",
        error.message
      );

      return res.status(500).json({
        mensaje: "Error al consultar los movimientos"
      });
    }
  }
);


/* ==========================================
   12. CONSULTAR MATERIALES PARA REPOSICIÓN
========================================== */

app.get(
  "/api/compras/pendientes",
  verificarUsuario,
  verificarRol,
  async (req, res) => {
    try {
      // Comprobar permisos
      if (
        !["administrador", "encargado"].includes(
          req.perfil.rol
        )
      ) {
        return res.status(403).json({
          mensaje: "No tienes permisos para consultar compras"
        });
      }

      // Consultar materiales activos
      const { data: materiales, error } =
        await req.supabaseUsuario
          .from("materiales")
          .select(`
            id,
            codigo,
            nombre,
            categoria,
            cantidad,
            stock_minimo,
            unidad_medida,
            activo
          `)
          .eq("activo", true)
          .order("nombre", { ascending: true });

      if (error) {
        console.error(
          "Error consultando materiales para compras:",
          error.message
        );

        return res.status(500).json({
          mensaje: "No se pudieron consultar los materiales"
        });
      }

      // Filtrar los materiales que necesitan reposición
      const comprasPendientes = (materiales || [])
        .filter(
          (material) =>
            material.cantidad <= material.stock_minimo
        )
        .map((material) => ({
          ...material,
          cantidad_sugerida: Math.max(
            0,
            material.stock_minimo - material.cantidad
          ),
          estado:
            material.cantidad === 0
              ? "Agotado"
              : "Bajo stock"
        }));

      return res.status(200).json({
        mensaje: "Materiales pendientes de reposición",
        total: comprasPendientes.length,
        materiales: comprasPendientes
      });

    } catch (error) {
      console.error(
        "Error inesperado al consultar compras:",
        error.message
      );

      return res.status(500).json({
        mensaje: "Error al consultar compras pendientes"
      });
    }
  }
);




// 9. Iniciar servidor
app.listen(PORT, () => {
  console.log(
    `Servidor funcionando en http://localhost:${PORT}`
  );
});
