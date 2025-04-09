import { Suspense } from 'react'
import ResultClient from './ResultClient'

interface ResultPageProps {
  params: {
    sessionId: string
  }
}

export default function ResultPage({ params }: ResultPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      }
    >
      <ResultClient sessionId={params.sessionId} />
    </Suspense>
  )
} 