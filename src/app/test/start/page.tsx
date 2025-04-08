'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Question {
  id: string
  category: string
  text: string
  order: number
}

interface TestSession {
  id: string
  user_id: string
  created_at: string
}

const categories = ['spending', 'saving', 'debt', 'emotion', 'goals'] as const
type Category = typeof categories[number]

export default function TestStart() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentCategory, setCurrentCategory] = useState<Category>('spending')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const initializeTest = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Test oturumu oluştur
        const { data: session, error: sessionError } = await supabase
          .from('test_sessions')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (sessionError) throw sessionError
        setSessionId(session.id)

        // Soruları getir
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .order('order', { ascending: true })

        if (questionsError) throw questionsError
        setQuestions(questionsData)
      } catch (err) {
        setError('Test başlatılırken bir hata oluştu. Lütfen tekrar deneyin.')
        console.error('Error initializing test:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeTest()
  }, [router])

  const currentQuestions = questions.filter(q => q.category === currentCategory)
  const currentQuestion = currentQuestions[currentQuestionIndex]

  const handleAnswer = async (value: number) => {
    if (!sessionId || !currentQuestion) return

    try {
      const { error } = await supabase
        .from('test_answers')
        .insert({
          session_id: sessionId,
          question_id: currentQuestion.id,
          answer_value: value
        })

      if (error) throw error

      setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))

      // Sonraki soruya geç
      if (currentQuestionIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        // Kategori tamamlandı, sonraki kategoriye geç
        const currentCategoryIndex = categories.indexOf(currentCategory)
        if (currentCategoryIndex < categories.length - 1) {
          setCurrentCategory(categories[currentCategoryIndex + 1])
          setCurrentQuestionIndex(0)
        } else {
          // Test tamamlandı, bekleme sayfasına yönlendir
          router.push(`/test/waiting?sessionId=${sessionId}`)
        }
      }
    } catch (err) {
      setError('Cevap kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
      console.error('Error saving answer:', err)
    }
  }

  const getCategoryName = (category: Category): string => {
    const names: Record<Category, string> = {
      spending: 'Harcama Alışkanlıkları',
      saving: 'Birikim Alışkanlıkları',
      debt: 'Borç Yönetimi',
      emotion: 'Para ile İlişki',
      goals: 'Ortak Hedefler'
    }
    return names[category]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  const progress = ((categories.indexOf(currentCategory) * 20) + 
    ((currentQuestionIndex + 1) / currentQuestions.length * 20))

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {getCategoryName(currentCategory)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Soru Kartı */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQuestion?.text}
          </h2>

          {/* Cevap Seçenekleri */}
          <div className="space-y-4 mt-6">
            {[1, 2, 3, 4].map((value) => (
              <button
                key={value}
                onClick={() => handleAnswer(value)}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${
                  answers[currentQuestion?.id || ''] === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {value === 1 && 'Kesinlikle Katılmıyorum'}
                    {value === 2 && 'Katılmıyorum'}
                    {value === 3 && 'Katılıyorum'}
                    {value === 4 && 'Kesinlikle Katılıyorum'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 