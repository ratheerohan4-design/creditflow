import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/data/types'

const DEFAULT_MERCHANT_ID = 'm1'
const DEFAULT_LENDER_ID = 'l1'

interface SessionState {
  role: Role | null
  name: string
  phone: string
  merchantId: string | null
  lenderId: string | null
  signedInAt: string | null
  signIn: (role: Role, phone: string) => void
  signOut: () => void
}

const ROLE_IDENTITY: Record<
  Role,
  { name: string; merchantId: string | null; lenderId: string | null }
> = {
  merchant: { name: 'Rakesh Sharma', merchantId: DEFAULT_MERCHANT_ID, lenderId: null },
  lender: { name: 'Suresh Chandra', merchantId: null, lenderId: DEFAULT_LENDER_ID },
  admin: { name: 'Priya Nair', merchantId: null, lenderId: null },
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      name: '',
      phone: '',
      merchantId: null,
      lenderId: null,
      signedInAt: null,
      signIn: (role, phone) => {
        const identity = ROLE_IDENTITY[role]
        set({
          role,
          phone,
          name: identity.name,
          merchantId: identity.merchantId,
          lenderId: identity.lenderId,
          signedInAt: new Date().toISOString(),
        })
      },
      signOut: () =>
        set({
          role: null,
          name: '',
          phone: '',
          merchantId: null,
          lenderId: null,
          signedInAt: null,
        }),
    }),
    { name: 'creditflow-session' },
  ),
)
