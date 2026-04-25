-- Configuración de Storage para imágenes de inventario

-- 1. Crear el bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inventario_imagenes', 'inventario_imagenes', true);

-- 2. Políticas de Storage
-- Permitir ver imágenes a cualquier usuario autenticado del centro
-- (O incluso público si el bucket es public, pero restringimos la subida)

CREATE POLICY "Storage: Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'inventario_imagenes' AND
    (storage.foldername(name))[1] = (SELECT centro_id::text FROM public.perfiles WHERE id = auth.uid())
);

CREATE POLICY "Storage: Usuarios pueden ver imágenes de su centro"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'inventario_imagenes' AND
    (storage.foldername(name))[1] = (SELECT centro_id::text FROM public.perfiles WHERE id = auth.uid())
);

CREATE POLICY "Storage: Usuarios pueden borrar sus propias imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'inventario_imagenes' AND
    (storage.foldername(name))[1] = (SELECT centro_id::text FROM public.perfiles WHERE id = auth.uid())
);
