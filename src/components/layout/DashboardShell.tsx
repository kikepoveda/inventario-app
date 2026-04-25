'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface DashboardShellProps {
  children: React.ReactNode
  userEmail?: string
  centroNombre?: string
  role?: string
}

export default function DashboardShell({ 
  children, 
  userEmail, 
  centroNombre,
  role 
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar (Drawer) */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-900/80" 
          onClick={() => setSidebarOpen(false)}
        />

        <div 
          className={`fixed inset-y-0 left-0 flex w-full max-w-xs transform transition duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar role={role} onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Static Sidebar (Desktop) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar role={role} />
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <Header 
          userEmail={userEmail} 
          centroNombre={centroNombre} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="py-6 sm:py-10">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
            <div className="text-sm sm:text-base">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
