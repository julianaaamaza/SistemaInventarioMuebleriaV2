-- SISTEMA DE INVENTARIO DE MUEBLERÍA
-- Trigger para actualizar el stock automáticamente

-- Este trigger ejecuta la función
-- actualizar_stock_movimiento()
-- después de registrar una entrada o salida.

CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT ON public.movimientos
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_stock_movimiento();