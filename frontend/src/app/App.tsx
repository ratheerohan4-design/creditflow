import { Route, Routes } from 'react-router-dom'
import { RequireRole } from '@/app/RoleGuard'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { LenderLayout } from '@/app/layouts/LenderLayout'
import { MerchantLayout } from '@/app/layouts/MerchantLayout'
import { NotFoundPage } from '@/app/NotFoundPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { LandingPage } from '@/features/landing/LandingPage'

import { MerchantHome } from '@/features/merchant/MerchantHome'
import { MerchantProgress } from '@/features/merchant/MerchantProgress'
import { MerchantQr } from '@/features/merchant/MerchantQr'
import { MerchantAlerts } from '@/features/merchant/MerchantAlerts'
import { MerchantMore } from '@/features/merchant/MerchantMore'
import { MerchantCredit } from '@/features/merchant/MerchantCredit'
import { MerchantTransactions } from '@/features/merchant/MerchantTransactions'
import { MerchantAgreement } from '@/features/merchant/MerchantAgreement'
import { MerchantSubscription } from '@/features/merchant/MerchantSubscription'
import { MerchantSupport } from '@/features/merchant/MerchantSupport'
import { LogCashSale } from '@/features/merchant/LogCashSale'

import { LenderPortfolio } from '@/features/lender/LenderPortfolio'
import { LenderMerchants } from '@/features/lender/LenderMerchants'
import { LenderRepayment } from '@/features/lender/LenderRepayment'
import { LenderAgreement } from '@/features/lender/LenderAgreement'
import { LenderRisk } from '@/features/lender/LenderRisk'
import { LenderHistory } from '@/features/lender/LenderHistory'
import { LenderCompleted } from '@/features/lender/LenderCompleted'

import { AdminOverview } from '@/features/admin/AdminOverview'
import { AdminLeads } from '@/features/admin/AdminLeads'
import { AdminVerification } from '@/features/admin/AdminVerification'
import { AdminVerificationDetail } from '@/features/admin/AdminVerificationDetail'
import { AdminAgreementCreate } from '@/features/admin/AdminAgreementCreate'
import { AdminQr } from '@/features/admin/AdminQr'
import { AdminOverrides } from '@/features/admin/AdminOverrides'
import { AdminDisputes } from '@/features/admin/AdminDisputes'
import { AdminDisputeDetail } from '@/features/admin/AdminDisputeDetail'
import { AdminFees } from '@/features/admin/AdminFees'
import { AdminRisk } from '@/features/admin/AdminRisk'
import { AdminAudit } from '@/features/admin/AdminAudit'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireRole role="merchant" />}>
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<MerchantHome />} />
          <Route path="progress" element={<MerchantProgress />} />
          <Route path="qr" element={<MerchantQr />} />
          <Route path="alerts" element={<MerchantAlerts />} />
          <Route path="more" element={<MerchantMore />} />
          <Route path="credit" element={<MerchantCredit />} />
          <Route path="transactions" element={<MerchantTransactions />} />
          <Route path="agreement" element={<MerchantAgreement />} />
          <Route path="subscription" element={<MerchantSubscription />} />
          <Route path="support" element={<MerchantSupport />} />
          <Route path="log-cash-sale" element={<LogCashSale />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="lender" />}>
        <Route path="/lender" element={<LenderLayout />}>
          <Route index element={<LenderPortfolio />} />
          <Route path="merchants" element={<LenderMerchants />} />
          <Route path="merchants/:merchantId" element={<LenderRepayment />} />
          <Route path="merchants/:merchantId/agreement" element={<LenderAgreement />} />
          <Route path="risk" element={<LenderRisk />} />
          <Route path="history" element={<LenderHistory />} />
          <Route path="completed" element={<LenderCompleted />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route
            path="verification/:verificationId"
            element={<AdminVerificationDetail />}
          />
          <Route path="agreement-new" element={<AdminAgreementCreate />} />
          <Route path="qr" element={<AdminQr />} />
          <Route path="overrides" element={<AdminOverrides />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="disputes/:disputeId" element={<AdminDisputeDetail />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="risk" element={<AdminRisk />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
