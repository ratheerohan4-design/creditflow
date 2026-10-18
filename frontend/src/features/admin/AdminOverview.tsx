import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LastUpdated } from '@/components/shared/LastUpdated'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

export function AdminOverview() {
  useDocumentTitle('Operations overview')

  const query = useQuery({
    queryKey: queryKeys.admin.overview(),
    queryFn: () => adminApi.getOverview(),
  })

  return (
    <QueryBoundary query={query}>
      {({ stats, exceptions }) => (
        <div className="space-y-5">
          <PageHeader
            title="Operations overview"
            description="What needs attention today"
            actions={
              <LastUpdated at={stats.generatedAt} onRefresh={() => query.refetch()} />
            }
          />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Active agreements"
              value={String(stats.activeAgreements)}
              hint="Live credits currently routing"
            />
            <StatCard
              label="Verifications pending"
              value={String(stats.verificationsPending)}
              tone={stats.verificationsPending > 0 ? 'amber' : 'default'}
              icon={<FileWarning className="h-4 w-4" />}
              hint={
                <Link
                  to="/admin/verification"
                  className="text-teal font-semibold hover:underline"
                >
                  Open the queue
                </Link>
              }
            />
            <StatCard
              label="Open disputes"
              value={String(stats.openDisputes)}
              tone={stats.openDisputes > 0 ? 'amber' : 'default'}
              icon={<AlertTriangle className="h-4 w-4" />}
              hint={
                <Link
                  to="/admin/disputes"
                  className="text-teal font-semibold hover:underline"
                >
                  Review disputes
                </Link>
              }
            />
            <StatCard
              label="Routing success rate"
              value={`${stats.routingSuccessRate}%`}
              hint="Payments routed without a failed step"
            />
            <StatCard
              label="Reconciliation"
              value={stats.reconciliation === 'passed' ? 'Passed' : 'Failed'}
              tone={stats.reconciliation === 'passed' ? 'success' : 'danger'}
              icon={<CheckCircle2 className="h-4 w-4" />}
              hint={formatDateTime(stats.reconciliationAt)}
            />
            <StatCard
              label="Default rate"
              value={`${stats.defaultRate}%`}
              tone={stats.defaultRate > 8 ? 'amber' : 'default'}
              hint="Active agreements past 21 days with no payment"
            />
            <StatCard
              label="Sales today"
              value={formatMoney(stats.totalSalesToday)}
              hint={`Across ${stats.activeAgreements} live shops`}
            />
            <StatCard
              label="Routed to lenders today"
              value={formatMoney(stats.totalRoutedToday)}
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Exception queue</span>
                <span className="text-muted text-[12px] font-normal">
                  {exceptions.length} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exceptions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="text-success mb-2 h-6 w-6" />
                  <p className="text-ink text-sm font-semibold">Queue is clear</p>
                  <p className="text-muted mt-1 text-[13px]">
                    No disputes, escalations or unpaid fees waiting.
                  </p>
                </div>
              ) : (
                <ul className="divide-line divide-y">
                  {exceptions.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            status={
                              item.kind === 'Dispute'
                                ? 'open'
                                : item.kind === 'Risk'
                                  ? 'escalated'
                                  : 'unpaid'
                            }
                          />
                          <p className="text-ink truncate text-[13px] font-semibold">
                            {item.label}
                          </p>
                        </div>
                        <p className="text-muted mt-0.5 text-[12px]">
                          {item.detail} · {formatDateTime(item.at)}
                        </p>
                      </div>
                      <Link
                        to={
                          item.kind === 'Dispute'
                            ? `/admin/disputes/${item.id}`
                            : item.kind === 'Risk'
                              ? '/admin/risk'
                              : '/admin/fees'
                        }
                        className="text-teal inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold hover:underline"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="text-muted h-4 w-4" />
                <p className="text-muted text-[13px]">
                  Routing runs every hour. Reconciliation closes at 9:12 pm IST.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/audit">View audit log</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </QueryBoundary>
  )
}
