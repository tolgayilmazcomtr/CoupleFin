'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { User, TestSession } from '@/types'

interface TestResult {
  id: string
  score: number
  created_at: string
  status: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testSessions, setTestSessions] = useState<TestSession[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        // Test oturumlarını getir
        const { data: sessions, error: sessionsError } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (sessionsError) throw sessionsError
        setTestSessions(sessions || [])

        await fetchTestResults(user.id)
        await checkPremiumStatus(user.id)
      } catch (err) {
        setError('Kullanıcı bilgileri alınamadı')
        console.error('Error fetching user:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const fetchTestResults = async (userId: string) => {
    try {
      // Test oturumlarını getir
      const { data: sessions, error: sessionsError } = await supabase
        .from('test_sessions')
        .select('id, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (sessionsError) {
        console.error('Test oturumları getirme hatası:', sessionsError)
        throw sessionsError
      }

      if (!sessions || sessions.length === 0) {
        setTestResults([])
        return
      }

      // Her oturum için cevapları getir
      const results = await Promise.all(
        sessions.map(async (session) => {
          // Kullanıcı cevaplarını getir
          const { data: userAnswers, error: userAnswersError } = await supabase
            .from('test_answers')
            .select('question_id, answer_value')
            .eq('session_id', session.id)
            .eq('is_partner', false)

          if (userAnswersError) {
            console.error('Kullanıcı cevapları getirme hatası:', userAnswersError)
            throw userAnswersError
          }

          // Partner cevaplarını getir
          const { data: partnerAnswers, error: partnerAnswersError } = await supabase
            .from('test_answers')
            .select('question_id, answer_value')
            .eq('session_id', session.id)
            .eq('is_partner', true)

          if (partnerAnswersError) {
            console.error('Partner cevapları getirme hatası:', partnerAnswersError)
            throw partnerAnswersError
          }

          if (!userAnswers || !partnerAnswers || userAnswers.length === 0 || partnerAnswers.length === 0) {
            return {
              id: session.id,
              score: 0,
              created_at: session.created_at,
              status: session.status
            }
          }

          // Cevapları grupla
          const userAnswersMap: Record<string, number> = {}
          const partnerAnswersMap: Record<string, number> = {}

          userAnswers.forEach(answer => {
            userAnswersMap[answer.question_id] = Number(answer.answer_value)
          })

          partnerAnswers.forEach(answer => {
            partnerAnswersMap[answer.question_id] = Number(answer.answer_value)
          })

          // Skorları hesapla
          let matches = 0
          let total = 0

          Object.entries(userAnswersMap).forEach(([questionId, answer]) => {
            const partnerAnswer = partnerAnswersMap[questionId]
            if (typeof partnerAnswer === 'number' && !isNaN(partnerAnswer)) {
              if (Math.abs(answer - partnerAnswer) <= 1) {
                matches++
              }
              total++
            }
          })

          const score = total > 0 ? (matches / total) * 100 : 0

          return {
            id: session.id,
            score: Math.round(score),
            created_at: session.created_at,
            status: session.status
          }
        })
      )

      setTestResults(results)
    } catch (error) {
      console.error('Test sonuçları getirme hatası:', error)
      setError('Test sonuçları yüklenirken bir hata oluştu')
    }
  }

  const checkPremiumStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_premium')
        .eq('id', userId)
        .single()

      if (error) throw error
      setIsPremium(data?.is_premium || false)
    } catch (error) {
      console.error('Premium durumu kontrol hatası:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Çıkış yapma hatası:', error)
    }
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Test Başlatma Kartı */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Test Başlat</h2>
            <p className="text-gray-600 mb-4">
              Partnerinizle finansal uyumluluğunuzu test edin ve ilişkinizi güçlendirin.
            </p>
            <Link
              href="/test/start"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Testi Başlat
            </Link>
          </div>

          {/* Bekleyen Testler */}
          {testSessions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bekleyen Testler</h2>
              <div className="space-y-4">
                {testSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {session.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(session.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {session.status === 'completed' ? 'Tamamlandı' : 'Partner Bekleniyor'}
                      </span>
                    </div>
                    {session.status === 'completed' ? (
                      <Link
                        href={`/result/${session.id}`}
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                      >
                        Sonuçları Görüntüle
                        <svg
                          className="ml-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Partneriniz testi tamamladığında sonuçlarınızı görebileceksiniz.
                        </p>
                        <Link
                          href={`/test/waiting?sessionId=${session.id}`}
                          className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                        >
                          Durumu Kontrol Et
                          <svg
                            className="ml-1 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sonuçlar Kartı */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Test Sonuçları</h2>
            <div className="space-y-4">
              {testResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {new Date(result.created_at).toLocaleDateString('tr-TR')}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uyum Skoru: {result.score.toFixed(1)}%
                      </p>
                    </div>
                    <Link
                      href={`/result/${result.id}`}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Detayları Gör
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Kartı */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Premium Özellikler</h2>
            <p className="text-gray-600 mb-4">
              {isPremium
                ? 'Premium üyeliğiniz aktif. Tüm özelliklere erişebilirsiniz.'
                : 'Premium üye olun ve özel içeriklere erişin.'}
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isPremium ? 'Premium İçerikler' : 'Premium\'a Yükselt'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 