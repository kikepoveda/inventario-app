'use client'

import { useState, useEffect } from 'react'
import { getUsuarios, inviteUser, deleteUser } from '@/app/actions/users'
import { getCentros } from '@/app/actions/admin'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [centros, setCentros] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'centro'>('centro')
  const [centroId, setCentroId] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    const [u, c] = await Promise.all([getUsuarios(), getCentros()])
    setUsuarios(u)
    setCentros(c)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await inviteUser(email, nombre, role, password, centroId || undefined)
      alert('Usuario creado correctamente')
      setEmail('')
      setNombre('')
      setPassword('')
      loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Se borrará de Auth y del perfil.')) return
    try {
      await deleteUser(id)
      alert('Usuario eliminado')
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Crear Nuevo Usuario</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="text"
            placeholder="Nombre Completo"
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
          <select 
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="centro">Gestor de Centro</option>
            <option value="admin">Administrador Global</option>
          </select>
          {role === 'centro' && (
            <select 
              className="input"
              value={centroId}
              onChange={(e) => setCentroId(e.target.value)}
              required
            >
              <option value="">Asignar a Centro...</option>
              {centros.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary md:col-span-2">
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{u.role}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.centros?.nombre || '-'}</td>
                <td className="px-6 py-4 text-sm text-right">
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
