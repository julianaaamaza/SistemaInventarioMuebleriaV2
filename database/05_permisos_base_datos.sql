-- SISTEMA DE INVENTARIO DE MUEBLERÍA
-- Permisos de acceso a las tablas
--
-- Script para configurar los permisos en una
-- base de datos nueva, después de crear las tablas.
-- NO ejecutar sobre la base de datos actual.

-- Retirar los permisos generales de acceso anónimo.
REVOKE ALL ON TABLE
    public.materiales,
    public.movimientos,
    public.perfiles
FROM anon;

-- Permisos para usuarios autenticados.
GRANT SELECT, INSERT, UPDATE
ON TABLE public.materiales
TO authenticated;

GRANT SELECT, INSERT
ON TABLE public.movimientos
TO authenticated;

GRANT SELECT
ON TABLE public.perfiles
TO authenticated;

-- Permisos para los identificadores automáticos.
GRANT USAGE
ON SEQUENCE public.materiales_id_seq,
            public.movimientos_id_seq
TO authenticated;

-- IMPORTANTE:
-- Los permisos anteriores trabajan junto con RLS.
-- Las políticas determinan qué operaciones puede
-- realizar cada usuario según su rol.