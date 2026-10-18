import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/data/types'
import { useSession } from '@/stores/session'

export const ROLE_HOME: Record<Role, string> = {
  merchant: '/merchant',
  lender: '/lender',
  admin: '/admin',
}

export function RequireRole({ role }: { role: Role }) {
  const sessionRole = useSession((state) => state.role)
  if (!sessionRole) return <Navigate to="/login" replace />
  if (sessionRole !== role) return <Navigate to={ROLE_HOME[sessionRole]} replace />
  return <Outlet />
}
