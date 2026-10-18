import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { adminApi, stageLabel } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { Lead, LeadStage } from '@/data/types'
import { formatMoney, relativeFromNow } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const STAGES: LeadStage[] = [
  'lead',
  'contacted',
  'visit',
  'verified',
  'agreement',
  'active',
]

export function AdminLeads() {
  useDocumentTitle('Leads')

  const query = useQuery({
    queryKey: queryKeys.admin.leads(),
    queryFn: () => adminApi.getLeads(),
  })

  const queryClient = useQueryClient()
  const move = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      adminApi.moveLead(id, stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads pipeline"
        description="Move a shop forward when the next step happens"
      />

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No leads in the pipeline',
          body: 'New shop sign-ups appear here.',
        }}
      >
        {(rows) => (
          <div className="cf-scroll -mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex min-w-max gap-3">
              {STAGES.map((stage, stageIndex) => {
                const inStage = rows.filter((lead: Lead) => lead.stage === stage)
                return (
                  <section
                    key={stage}
                    className="border-line bg-canvas w-72 shrink-0 rounded-[8px] border p-3"
                    aria-label={stageLabel(stage)}
                  >
                    <header className="mb-3 flex items-center justify-between">
                      <h2 className="text-navy text-[13px] font-semibold">
                        {stageLabel(stage)}
                      </h2>
                      <span className="bg-surface text-muted rounded-[6px] px-2 py-0.5 text-[12px] font-semibold tabular-nums">
                        {inStage.length}
                      </span>
                    </header>
                    <ul className="space-y-2">
                      {inStage.length === 0 ? (
                        <li className="border-line text-muted rounded-[6px] border border-dashed px-3 py-6 text-center text-[12px]">
                          Nothing here right now
                        </li>
                      ) : null}
                      {inStage.map((lead) => (
                        <li key={lead.id}>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-ink text-[13px] font-semibold">
                                {lead.businessName}
                              </p>
                              <p className="text-muted mt-0.5 flex items-center gap-1.5 text-[12px]">
                                <UserRound className="h-3.5 w-3.5" />
                                {lead.ownerName} · {lead.city}
                              </p>
                              <p className="text-muted mt-1 text-[12px] tabular-nums">
                                {formatMoney(lead.creditEstimate)} credit expected
                              </p>
                              <p className="text-muted mt-1 text-[12px]">{lead.note}</p>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-muted text-[11px]">
                                  {lead.assignedTo} · {relativeFromNow(lead.updatedAt)}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    disabled={stageIndex === 0 || move.isPending}
                                    aria-label={`Move ${lead.businessName} back`}
                                    onClick={() =>
                                      move.mutate({
                                        id: lead.id,
                                        stage: STAGES[Math.max(stageIndex - 1, 0)],
                                      })
                                    }
                                  >
                                    <ArrowLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    disabled={
                                      stageIndex === STAGES.length - 1 || move.isPending
                                    }
                                    aria-label={`Move ${lead.businessName} forward`}
                                    onClick={() =>
                                      move.mutate({
                                        id: lead.id,
                                        stage:
                                          STAGES[
                                            Math.min(stageIndex + 1, STAGES.length - 1)
                                          ],
                                      })
                                    }
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          </div>
        )}
      </QueryBoundary>

      <p className={cn('text-muted text-[12px]')}>
        Each move is written to the audit log with your name and the time.
      </p>
    </div>
  )
}
