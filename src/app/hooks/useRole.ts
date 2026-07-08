import { useMemo } from 'react'
import { useAuth } from '@/app/context/AuthContext'

export function useRole() {
  const { accessRole, isLoading } = useAuth()

  return useMemo(() => ({
    role: accessRole,
    isAdmin: accessRole === 'admin',
    isIncubationAdmin: accessRole === 'incubation_admin',
    isUser: accessRole === 'user',
    isTeam: accessRole === 'team',
    isLoading,
  }), [accessRole, isLoading])
}
