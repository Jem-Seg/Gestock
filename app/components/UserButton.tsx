"use client"
import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, Settings, User } from 'lucide-react'

interface UserButtonProps {
  mobile?: boolean
}

export function UserButton({ mobile = false }: UserButtonProps) {
  const { data: session } = useSession()

  if (!session?.user) return null

  const handleSignOut = () => {
    signOut({ callbackUrl: '/sign-in' })
  }

  // Version mobile : bouton pleine largeur
  if (mobile) {
    return (
      <div className="w-full space-y-2">
        <button 
          onClick={handleSignOut}
          className="btn btn-error btn-outline w-full gap-2"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    )
  }

  // Version desktop : dropdown
  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-content font-semibold">
            {session.user.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </label>
      <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
        <li className="menu-title">
          <span>{session.user.name}</span>
        </li>
        <li className="menu-title pb-2">
          <span className="text-xs">{session.user.email}</span>
        </li>
        <li>
          <a>
            <User className="w-4 h-4" />
            Profil
          </a>
        </li>
        <li>
          <a>
            <Settings className="w-4 h-4" />
            Paramètres
          </a>
        </li>
        <li>
          <a onClick={handleSignOut} className="text-error">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </a>
        </li>
      </ul>
    </div>
  )
}
