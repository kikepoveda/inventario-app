-- 1. Enums y Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'centro');
CREATE TYPE inventory_status AS ENUM ('bueno', 'regular', 'malo', 'baja');

-- 2. Tablas Base
CREATE TABLE centros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    centro_id UUID REFERENCES centros(id),
    role user_role NOT NULL DEFAULT 'centro',
    nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
    aula_id UUID REFERENCES aulas(id) ON DELETE SET NULL,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    numero_serie TEXT,
    caracteristicas JSONB DEFAULT '{}'::jsonb,
    categoria TEXT,
    ubicacion TEXT,
    unidades INTEGER NOT NULL DEFAULT 1,
    estado inventory_status NOT NULL DEFAULT 'bueno',
    observaciones TEXT,
    imagen_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unicidad del código por centro
    UNIQUE (centro_id, codigo)
);

-- 3. Row Level Security (RLS)
ALTER TABLE centros ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

-- 4. Funciones Auxiliares para RLS
CREATE OR REPLACE FUNCTION public.get_my_centro_id()
RETURNS UUID AS $$
    SELECT centro_id FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'admin' FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Políticas: Centros
CREATE POLICY "Centros: Admin global puede todo" ON centros
    FOR ALL USING (is_admin());

CREATE POLICY "Centros: Usuarios pueden ver su propio centro" ON centros
    FOR SELECT USING (id = get_my_centro_id());

-- 6. Políticas: Perfiles
CREATE POLICY "Perfiles: Admin global puede todo" ON perfiles
    FOR ALL USING (is_admin());

CREATE POLICY "Perfiles: Usuarios pueden ver su propio perfil" ON perfiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Perfiles: Usuarios pueden actualizar su propio perfil" ON perfiles
    FOR UPDATE USING (id = auth.uid());

-- 7. Políticas: Aulas
CREATE POLICY "Aulas: Admin global puede todo" ON aulas
    FOR ALL USING (is_admin());

CREATE POLICY "Aulas: Acceso por centro" ON aulas
    FOR ALL USING (centro_id = get_my_centro_id())
    WITH CHECK (centro_id = get_my_centro_id());

-- 8. Políticas: Inventario
CREATE POLICY "Inventario: Admin global puede todo" ON inventario
    FOR ALL USING (is_admin());

CREATE POLICY "Inventario: Acceso por centro" ON inventario
    FOR ALL USING (centro_id = get_my_centro_id())
    WITH CHECK (centro_id = get_my_centro_id());

-- 9. Triggers para gestión automática
-- Crear perfil automáticamente al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, role)
  VALUES (new.id, new.raw_user_meta_data->>'nombre', 'centro');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
