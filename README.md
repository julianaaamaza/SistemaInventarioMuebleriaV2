# Sistema de Inventario de Mueblería

## 1. Descripción del proyecto

Este proyecto consiste en el desarrollo de un sistema web de inventario para una mueblería, con el propósito de llevar un mejor control de los materiales que se utilizan en el trabajo diario.

La idea del sistema surge de la necesidad de mantener organizada la información de los materiales disponibles, ya que llevar este control de forma manual puede provocar confusiones con las cantidades y dificultar la identificación de los productos que necesitan reponerse.

Por esta razón, se desarrolló una aplicación que permite registrar materiales, consultar las cantidades disponibles, realizar entradas y salidas de stock y revisar cuáles se encuentran con pocas unidades.

Además, el sistema cuenta con un inicio de sesión y diferentes permisos según el tipo de usuario.

## 2. Objetivo del proyecto

El objetivo principal es desarrollar una aplicación web que facilite la administración del inventario de una mueblería, permitiendo mantener actualizadas las cantidades de materiales y registrar los movimientos realizados.

Con esta solución se busca que el encargado pueda consultar la información de manera más rápida y que el administrador tenga un mayor control sobre los materiales registrados.

## 3. Tecnologías utilizadas

Para desarrollar el proyecto se utilizaron diferentes herramientas, cada una encargada de una parte del funcionamiento del sistema.

**Frontend:**

- React: se utilizó para construir las pantallas y los componentes de la aplicación.
- JavaScript: permite desarrollar las funciones e interacciones del sistema.
- HTML y CSS: se utilizaron para organizar y diseñar las interfaces.
- Vite: facilita la ejecución y construcción del proyecto React.

**Backend:**

- Node.js: permite ejecutar el servidor.
- Express: se utilizó para crear las rutas de la API y procesar las solicitudes enviadas desde el frontend.

**Base de datos:**

- Supabase: se utilizó para almacenar la información en la nube.
- PostgreSQL: es la base de datos relacional donde se guardan los materiales, usuarios y movimientos.
- Supabase Authentication: permite realizar el inicio de sesión.

**Otras herramientas:**

- Visual Studio Code: editor utilizado para desarrollar el proyecto.
- Git y GitHub: permiten guardar el código y mantener un historial de los cambios.
- Render: plataforma donde se publicó el backend.
- Vercel: plataforma donde se publicó el frontend.

## 4. Arquitectura del sistema

El sistema fue desarrollado utilizando una arquitectura cliente-servidor, separando la aplicación en frontend, backend y base de datos.

El frontend está desarrollado con React y corresponde a la parte visual con la que interactúa el usuario. Desde allí se pueden consultar los materiales, registrar movimientos y acceder a las diferentes funciones.

El backend está desarrollado con Node.js y Express. Su función es recibir las solicitudes enviadas desde el frontend, comprobar los permisos de los usuarios y realizar las operaciones correspondientes.

Por último, la base de datos se encuentra en Supabase y permite almacenar la información de los materiales, perfiles de usuarios y movimientos del inventario.

De esta manera, cada parte cumple una función específica y se mantiene una mejor organización del proyecto.

## 5. Funcionalidades del sistema

El sistema cuenta con diferentes funciones para facilitar el control de los materiales de la mueblería.

- **Inicio de sesión:** permite ingresar utilizando un correo electrónico y una contraseña.
- **Panel principal:** muestra un resumen general del inventario.
- **Registro de materiales:** permite agregar nuevos materiales con sus respectivos datos.
- **Consulta de inventario:** muestra los materiales registrados y sus cantidades disponibles.
- **Edición de materiales:** permite modificar la información de un material.
- **Activación y desactivación:** permite cambiar el estado de un material sin eliminar necesariamente su registro.
- **Búsqueda y filtros:** ayudan a encontrar materiales por nombre, código, categoría o estado.
- **Registro de entradas:** permite agregar cantidades al inventario.
- **Registro de salidas:** permite descontar materiales utilizados.
- **Historial de movimientos:** muestra las entradas y salidas realizadas.
- **Alertas de stock:** permite identificar materiales que se encuentran con cantidades bajas.
- **Compras pendientes:** permite consultar materiales que podrían necesitar reposición.

## 6. Roles de usuario

Para controlar el acceso a las funciones se definieron dos tipos de usuarios.

**Administrador**

Tiene acceso a la administración de los materiales. Puede registrar nuevos productos, editar su información, activar o desactivar materiales y realizar movimientos de entrada y salida.

**Encargado**

Puede consultar el inventario y registrar entradas y salidas de materiales. Sin embargo, no puede crear, editar ni cambiar el estado de los materiales.

Esta separación permite que cada usuario tenga acceso únicamente a las funciones que le corresponden.

## 7. Base de datos

Para almacenar la información se utilizó PostgreSQL mediante Supabase.

La base de datos cuenta con tres tablas principales:

**perfiles:** almacena la información de los usuarios y el rol que tienen dentro del sistema.

**materiales:** contiene los datos de los materiales registrados, como código, nombre, categoría, cantidad disponible, unidad de medida y stock mínimo.

**movimientos:** permite guardar las entradas y salidas realizadas, indicando el material, tipo de movimiento, cantidad y fecha.

La tabla de movimientos se relaciona con la tabla de materiales mediante una clave foránea.

Además, se configuraron restricciones para evitar movimientos con cantidades incorrectas y un trigger que permite actualizar automáticamente el stock cuando se registra una entrada o salida.

## 8. Seguridad del sistema

Durante el desarrollo se consideraron diferentes medidas para proteger la información y controlar el acceso a las funciones.

El inicio de sesión se realiza mediante Supabase Authentication, que permite validar las credenciales de los usuarios.

También se implementó una verificación de permisos en el backend, de manera que las funciones administrativas no dependan solamente de ocultar botones en la pantalla.

Por otra parte, se utilizaron políticas de seguridad RLS en Supabase para controlar el acceso a los datos.

La configuración de los servicios se realiza mediante variables de entorno, evitando incluir contraseñas o claves secretas directamente en el código fuente.

## 9. Estructura del proyecto

El proyecto se encuentra organizado principalmente en dos carpetas.

```text
SistemaInventarioMuebleriaV2/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── config.js
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

La carpeta `frontend` contiene las interfaces y los componentes de React.

La carpeta `backend` contiene el servidor, las rutas de la API y las funciones que permiten comunicarse con Supabase.

## 10. Instalación y ejecución local

Para ejecutar el proyecto en un computador se necesita tener instalado Node.js y npm, además de contar con la configuración correspondiente de Supabase.

### Backend

Primero se debe abrir una terminal dentro de la carpeta `backend` e instalar las dependencias:

```bash
cd backend
npm install
```

Después se deben configurar las variables de entorno necesarias:

```env
SUPABASE_URL=URL_DEL_PROYECTO
SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICABLE
```

Una vez configuradas, se puede iniciar el servidor:

```bash
node server.js
```

El backend funciona en el puerto 3000.

### Frontend

Para ejecutar la interfaz se debe abrir otra terminal e ingresar a la carpeta `frontend`:

```bash
cd frontend
npm install
```

También se deben configurar las variables de entorno:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=URL_DEL_PROYECTO
VITE_SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICABLE
```

Finalmente, se inicia la aplicación con:

```bash
npm run dev
```

La terminal mostrará una dirección local que se puede abrir desde el navegador para utilizar el sistema.

## 11. Publicación del proyecto

Para que la aplicación pueda utilizarse desde Internet, se publicaron sus componentes en diferentes servicios.

**Frontend — Vercel**

https://sistema-inventario-muebleria-v2.vercel.app

**Backend — Render**

https://inventario-muebleria-backend.onrender.com

**Base de datos — Supabase**

La información se almacena en una base de datos PostgreSQL alojada en la nube.

Esta configuración permite acceder al sistema desde un navegador sin tener que ejecutar el proyecto de forma local.

## 12. Pruebas realizadas

Durante el desarrollo se realizaron diferentes pruebas para comprobar el funcionamiento de la aplicación.

Se verificó que los usuarios pudieran iniciar sesión y acceder a las funciones correspondientes a su rol.

También se probaron el registro, edición, activación y desactivación de materiales, junto con las entradas y salidas del inventario.

Se comprobó que los movimientos actualizaran las cantidades de los materiales y que los usuarios encargados no pudieran realizar operaciones exclusivas del administrador.

Finalmente, se revisó el funcionamiento del sistema después de publicarlo en Vercel y Render.

## 13. Consideraciones para utilizar el sistema

Para ingresar a la aplicación se necesita una cuenta registrada en Supabase con un rol asignado.

Las credenciales de prueba deben entregarse al docente de manera privada para que pueda revisar las funcionalidades.

No se deben publicar contraseñas ni claves secretas dentro del repositorio.
