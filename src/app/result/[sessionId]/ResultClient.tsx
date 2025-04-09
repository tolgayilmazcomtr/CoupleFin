'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TestSession, TestAnswer } from '@/types'

interface ResultClientProps {
  sessionId: string
}

export default function ResultClient({ sessionId }: ResultClientProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})

  const calculateScores = useCallback((answers: Record<string, number>) => {
    const categories: Record<string, number[]> = {
      iletişim: [],
      güven: [],
      değerler: [],
      gelecek: [],
      cinsellik: [],
    }

    Object.entries(answers).forEach(([questionId, answer]) => {
      const category = questionId.split('_')[0]
      if (categories[category]) {
        categories[category].push(answer)
      }
    })

    const scores: Record<string, number> = {}
    Object.entries(categories).forEach(([category, values]) => {
      if (values.length > 0) {
        scores[category] = Math.round(
          (values.reduce((a, b) => a + b, 0) / values.length) * 20
        )
      }
    })

    return scores
  }, [])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        if (!session) {
          setError('Oturum bulunamadı')
          return
        }

        const { data: testSession, error: testError } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (testError) throw testError

        const { data: answers, error: answersError } = await supabase
          .from('test_answers')
          .select('*')
          .eq('session_id', sessionId)

        if (answersError) throw answersError

        const userAnswers: Record<string, number> = {}
        const partnerAnswers: Record<string, number> = {}

        answers.forEach((answer: TestAnswer) => {
          if (answer.user_id === session.user.id) {
            userAnswers[answer.question_id] = answer.answer
          } else {
            partnerAnswers[answer.question_id] = answer.answer
          }
        })

        const userScores = calculateScores(userAnswers)
        const partnerScores = calculateScores(partnerAnswers)

        const combinedScores: Record<string, number> = {}
        Object.keys(userScores).forEach((category) => {
          combinedScores[category] = Math.round(
            (userScores[category] + partnerScores[category]) / 2
          )
        })

        setScores(combinedScores)
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('Bir hata oluştu')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, calculateScores])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Test Sonuçları
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            İlişkinizin farklı alanlardaki uyumunu gösteren sonuçlar
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(scores).map(([category, score]) => (
            <div
              key={category}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {score}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 