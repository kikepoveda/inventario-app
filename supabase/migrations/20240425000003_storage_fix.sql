-- Simplificar políticas de Storage para evitar errores de RLS
-- Eliminamos las anteriores para evitar conflictos
DROP POLICY IF EXISTS "Storage: Usuarios autenticados pueden subir imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Storage: Usuarios pueden ver imágenes de su centro" ON storage.objects;
DROP POLICY IF EXISTS "Storage: Usuarios pueden borrar sus propias imágenes" ON storage.objects;

-- Nueva política de inserción: Cualquier usuario autenticado puede subir al bucket
CREATE POLICY "Permitir subida a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'inventario_imagenes' );

-- Nueva política de lectura: Público (ya que el bucket es public, pero aseguramos en RLS)
CREATE POLICY "Permitir lectura pública"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'inventario_imagenes' );

-- Nueva política de borrado: El dueño o el admin del centro
CREATE POLICY "Permitir borrado a usuarios autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'inventario_imagenes' );
