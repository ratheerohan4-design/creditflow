export const queryKeys = {
  merchant: {
    home: (id: string) => ['merchant', id, 'home'] as const,
    agreement: (id: string) => ['merchant', id, 'agreement'] as const,
    progress: (id: string) => ['merchant', id, 'progress'] as const,
    transactions: (id: string, filters: string) =>
      ['merchant', id, 'transactions', filters] as const,
    alerts: (id: string) => ['merchant', id, 'alerts'] as const,
    subscription: (id: string) => ['merchant', id, 'subscription'] as const,
    tickets: (id: string) => ['merchant', id, 'tickets'] as const,
    profile: (id: string) => ['merchant', id, 'profile'] as const,
  },
  lender: {
    portfolio: (id: string) => ['lender', id, 'portfolio'] as const,
    merchants: (id: string, filters: string) =>
      ['lender', id, 'merchants', filters] as const,
    repayment: (lenderId: string, merchantId: string) =>
      ['lender', lenderId, 'repayment', merchantId] as const,
    risk: (id: string) => ['lender', id, 'risk'] as const,
    history: (id: string, filters: string) => ['lender', id, 'history', filters] as const,
    completed: (id: string) => ['lender', id, 'completed'] as const,
  },
  admin: {
    overview: () => ['admin', 'overview'] as const,
    leads: () => ['admin', 'leads'] as const,
    verifications: () => ['admin', 'verifications'] as const,
    verification: (id: string) => ['admin', 'verification', id] as const,
    qr: () => ['admin', 'qr'] as const,
    disputes: () => ['admin', 'disputes'] as const,
    dispute: (id: string) => ['admin', 'dispute', id] as const,
    fees: (filters: string) => ['admin', 'fees', filters] as const,
    risk: () => ['admin', 'risk'] as const,
    audit: (filters: string) => ['admin', 'audit', filters] as const,
  },
}
