'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface TestSession {
  id: string
  user_id: string
  answers: Record<string, number>
  partner_answers: Record<string, number>
  status: string
}

interface CategoryScore {
  category: string
  score: number
  total: number
}

interface ResultClientProps {
  sessionId: string
}

export default function ResultClient({ sessionId }: ResultClientProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<TestSession | null>(null)
  const [overallScore, setOverallScore] = useState<number>(0)
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Test oturumunu getir
        const { data: session, error: sessionError } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) throw sessionError

        if (!session || session.status !== 'completed') {
          setError('Test sonuçları henüz hazır değil')
          setLoading(false)
          return
        }

        // Kullanıcı ve partner cevaplarını getir
        const { data: answers, error: answersError } = await supabase
          .from('test_answers')
          .select('*')
          .eq('session_id', sessionId)

        if (answersError) throw answersError

        // Cevapları grupla
        const userAnswers: Record<string, number> = {}
        const partnerAnswers: Record<string, number> = {}

        answers.forEach(answer => {
          if (answer.is_partner) {
            partnerAnswers[answer.question_id] = answer.answer_value
          } else {
            userAnswers[answer.question_id] = answer.answer_value
          }
        })

        setSession({
          ...session,
          answers: userAnswers,
          partner_answers: partnerAnswers
        })
        calculateScores({
          ...session,
          answers: userAnswers,
          partner_answers: partnerAnswers
        })
      } catch (err) {
        setError('Test sonuçları yüklenirken bir hata oluştu')
        console.error('Error fetching session:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, router])

  const calculateScores = (session: TestSession) => {
    if (!session.answers || !session.partner_answers) {
      setError('Test sonuçları eksik')
      return
    }

    // Kategorileri ve soruları grupla
    const categories = new Map<string, { matches: number; total: number }>()

    // Her soru için eşleşme kontrolü
    Object.entries(session.answers).forEach(([questionId, answer]) => {
      const partnerAnswer = session.partner_answers[questionId]
      if (partnerAnswer === answer) {
        const category = getQuestionCategory(questionId)
        const current = categories.get(category) || { matches: 0, total: 0 }
        categories.set(category, {
          matches: current.matches + 1,
          total: current.total + 1
        })
      }
    })

    // Kategori skorlarını hesapla
    const scores: CategoryScore[] = []
    let totalMatches = 0
    let totalQuestions = 0

    categories.forEach((value, category) => {
      const score = (value.matches / value.total) * 100
      scores.push({ category, score, total: value.total })
      totalMatches += value.matches
      totalQuestions += value.total
    })

    setCategoryScores(scores)
    setOverallScore((totalMatches / totalQuestions) * 100)
  }

  const getQuestionCategory = (questionId: string) => {
    // Bu fonksiyon soru ID'sine göre kategori döndürmeli
    // Şimdilik örnek olarak sabit bir değer döndürüyoruz
    return 'Genel Uyum'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Sonuçları</h1>
            <div className="text-5xl font-bold mb-4">
              <span className={getScoreColor(overallScore)}>
                {overallScore.toFixed(1)}%
              </span>
            </div>
            <p className="text-gray-600">
              Genel Uyum Skorunuz
            </p>
          </div>

          <div className="space-y-6">
            {categoryScores.map((category) => (
              <div key={category.category} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{category.category}</h3>
                  <span className={`text-lg font-medium ${getScoreColor(category.score)}`}>
                    {category.score.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-full ${getScoreColor(category.score).replace('text', 'bg')} rounded-full`}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 