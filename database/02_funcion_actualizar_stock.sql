CREATE OR REPLACE FUNCTION public.actualizar_stock_movimiento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Verificar usuario autorizado
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = auth.uid()
      AND rol IN ('administrador', 'encargado')
  ) THEN
    RAISE EXCEPTION 'Usuario no autorizado';
  END IF;

  -- Validar que el material esté activo
  IF NOT EXISTS (
    SELECT 1
    FROM public.materiales
    WHERE id = NEW.material_id
      AND activo = TRUE
  ) THEN
    RAISE EXCEPTION 'Material no encontrado o inactivo';
  END IF;

  -- Registrar entrada
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.materiales
    SET cantidad = cantidad + NEW.cantidad
    WHERE id = NEW.material_id
      AND activo = TRUE
      AND cantidad <= 2147483647 - NEW.cantidad;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Material inactivo o cantidad supera el límite permitido';
    END IF;

  -- Registrar salida
  ELSIF NEW.tipo = 'salida' THEN
    UPDATE public.materiales
    SET cantidad = cantidad - NEW.cantidad
    WHERE id = NEW.material_id
      AND activo = TRUE
      AND cantidad >= NEW.cantidad;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Material inactivo o stock insuficiente';
    END IF;

  ELSE
    RAISE EXCEPTION 'Tipo de movimiento no válido';
  END IF;

  RETURN NEW;
END;
$function$;
