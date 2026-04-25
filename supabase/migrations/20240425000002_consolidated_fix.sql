-- ==========================================
-- CONSOLIDATED SECURITY & MULTI-TENANCY FIX
-- ==========================================

-- 1. HARDEN FUNCTIONS
-- Fixes "mutable search_path" warnings and ensures security
CREATE OR REPLACE FUNCTION public.get_my_centro_id()
RETURNS UUID AS $$
    SELECT centro_id FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'admin' FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. RESET POLICIES
-- Drop everything to ensure a clean state
DROP POLICY IF EXISTS "Centros: Admin global puede todo" ON centros;
DROP POLICY IF EXISTS "Centros: Usuarios pueden ver su propio centro" ON centros;
DROP POLICY IF EXISTS "Centros: solo admin puede insertar" ON centros;

DROP POLICY IF EXISTS "Perfiles: Admin global puede todo" ON perfiles;
DROP POLICY IF EXISTS "Perfiles: Usuarios pueden ver su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Perfiles: Usuarios pueden actualizar su propio perfil" ON perfiles;

DROP POLICY IF EXISTS "Aulas: Admin global puede todo" ON aulas;
DROP POLICY IF EXISTS "Aulas: Acceso por centro" ON aulas;

DROP POLICY IF EXISTS "Inventario: Admin global puede todo" ON inventario;
DROP POLICY IF EXISTS "Inventario: Acceso por centro" ON inventario;

-- 3. APPLY NEW POLICIES (AS REQUESTED)

-- TABLA: CENTROS
-- Solo admin puede insertar
CREATE POLICY "Centros: solo admin puede insertar" ON centros
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());

-- Admin ve todo, usuarios ven su centro
CREATE POLICY "Centros: visualizacion" ON centros
    FOR SELECT TO authenticated
    USING (is_admin() OR id = get_my_centro_id());

-- TABLA: PERFILES
CREATE POLICY "Perfiles: admin ve todo" ON perfiles
    FOR SELECT TO authenticated
    USING (is_admin() OR id = auth.uid());

CREATE POLICY "Perfiles: update propio" ON perfiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- TABLA: AULAS
-- CRUD solo si aulas.centro_id = perfiles.centro_id (o admin)
CREATE POLICY "Aulas: CRUD por centro o admin" ON aulas
    FOR ALL TO authenticated
    USING (is_admin() OR centro_id = get_my_centro_id())
    WITH CHECK (is_admin() OR centro_id = get_my_centro_id());

-- TABLA: INVENTARIO
-- CRUD solo si inventario.centro_id = perfiles.centro_id (o admin)
CREATE POLICY "Inventario: CRUD por centro o admin" ON inventario
    FOR ALL TO authenticated
    USING (is_admin() OR centro_id = get_my_centro_id())
    WITH CHECK (is_admin() OR centro_id = get_my_centro_id());

-- 4. FINAL CHECKS
-- Ensure kike.poveda@gmail.com is admin
INSERT INTO public.perfiles (id, role, nombre)
SELECT id, 'admin', 'Kike Poveda' FROM auth.users WHERE email = 'kike.poveda@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
