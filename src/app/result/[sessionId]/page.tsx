import { Suspense } from 'react'
import ResultClient from './ResultClient'
import { headers } from 'next/headers'

async function getSessionId(params: { sessionId: string }) {
  return params.sessionId
}

export default async function ResultPage({ params }: { params: { sessionId: string } }) {
  const sessionId = await getSessionId(params)

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ResultClient sessionId={sessionId} />
    </Suspense>
  )
} 