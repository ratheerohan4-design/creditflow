import { RefreshCw } from 'lucide-react'
import { relativeFromNow } from '@/lib/format'
import { Button } from '@/components/ui/button'

interface LastUpdatedProps {
  at: string
  onRefresh?: () => void
  refreshing?: boolean
}

export function LastUpdated({ at, onRefresh, refreshing }: LastUpdatedProps) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-muted text-[12px] tabular-nums">
        Last updated: {relativeFromNow(at)} IST
      </p>
      {onRefresh ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh data"
        >
          <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      ) : null}
    </div>
  )
}
