import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/shared/Logo'
import { useDocumentTitle } from '@/lib/hooks'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Logo className="mx-auto h-8" />
          <h1 className="text-navy mt-6 text-[20px] font-semibold">
            This page doesn't exist
          </h1>
          <p className="text-muted mt-2 text-[13px]">
            The link may be old, or the page may have moved.
          </p>
          <Button asChild className="mt-6">
            <Link to="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
