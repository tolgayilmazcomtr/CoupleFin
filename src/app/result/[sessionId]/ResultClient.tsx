'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface ResultClientProps {
  sessionId: Promise<string>
}

export default function ResultClient({ sessionId }: ResultClientProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchResults() {
      try {
        const id = await sessionId
        const { data: session, error: sessionError } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('id', id)
          .single()

        if (sessionError) throw sessionError

        const { data: answers, error: answersError } = await supabase
          .from('test_answers')
          .select('*')
          .eq('session_id', id)

        if (answersError) throw answersError

        const userAnswers = answers.find(a => a.user_id === session.user_id)
        const partnerAnswers = answers.find(a => a.user_id === session.partner_id)

        if (!userAnswers || !partnerAnswers) {
          throw new Error('Test sonuçları bulunamadı')
        }

        const calculatedScores = calculateScores(userAnswers.answers, partnerAnswers.answers)
        setScores(calculatedScores)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [sessionId, supabase])

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div>Hata: {error}</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Sonuçları</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(scores).map(([category, score]) => (
          <div key={category} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{score}% uyum</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function calculateScores(userAnswers: Record<string, number>, partnerAnswers: Record<string, number>) {
  const scores: Record<string, number> = {}
  const categories = ['iletişim', 'finans', 'aile', 'kariyer', 'değerler']

  categories.forEach(category => {
    let total = 0
    let count = 0

    Object.entries(userAnswers).forEach(([key, value]) => {
      if (key.includes(category)) {
        const partnerValue = partnerAnswers[key]
        if (partnerValue !== undefined) {
          total += Math.abs(value - partnerValue)
          count++
        }
      }
    })

    if (count > 0) {
      const averageDiff = total / count
      scores[category] = Math.round(100 - (averageDiff * 20))
    }
  })

  return scores
} 