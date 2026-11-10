-- =====================================================
-- SISTEMA DE INVENTARIO DE MUEBLERÍA
-- Políticas de seguridad RLS - Supabase
-- =====================================================

-- Este archivo documenta las políticas del sistema.
-- Se utiliza después de crear las tablas.
-- NO ejecutarlo sobre la base de datos actual.

-- 1. ACTIVAR RLS

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- 2. PERFILES
-- Cada usuario puede consultar su propio perfil.

CREATE POLICY "Usuarios pueden ver su perfil"
ON public.perfiles
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

-- 3. MATERIALES
-- Administrador y encargado pueden consultar materiales.

CREATE POLICY "Usuarios autorizados pueden ver materiales"
ON public.materiales
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = (SELECT auth.uid())
          AND rol IN ('administrador', 'encargado')
    )
);

-- Solo el administrador puede agregar materiales.

CREATE POLICY "Administrador puede agregar materiales"
ON public.materiales
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = (SELECT auth.uid())
          AND rol = 'administrador'
    )
);

-- Solo el administrador puede editar materiales.

CREATE POLICY "Administrador puede editar materiales"
ON public.materiales
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = (SELECT auth.uid())
          AND rol = 'administrador'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = (SELECT auth.uid())
          AND rol = 'administrador'
    )
);

-- 4. MOVIMIENTOS
-- Administrador y encargado pueden consultar movimientos.

CREATE POLICY "Usuarios autorizados pueden ver movimientos"
ON public.movimientos
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = (SELECT auth.uid())
          AND rol IN ('administrador', 'encargado')
    )
);

-- Administrador y encargado pueden registrar movimientos.

CREATE POLICY "Usuarios autorizados pueden registrar movimientos"
ON public.movimientos
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = (SELECT auth.uid())
          AND rol IN ('administrador', 'encargado')
    )
);

-- =====================================================
-- Estas políticas limitan el acceso a los datos
-- según el usuario autenticado y su rol.
--
-- Las operaciones también son verificadas
-- por el backend de Node.js y Express.
-- =====================================================
