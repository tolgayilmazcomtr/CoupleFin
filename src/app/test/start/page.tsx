'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StartTestPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleStartTest = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: testSession, error: testError } = await supabase
        .from('test_sessions')
        .insert([
          {
            user_id: session.user.id,
            status: 'pending',
          },
        ])
        .select()
        .single()

      if (testError) throw testError

      router.push(`/test/questions/${testSession.id}`)
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Uyumluluk Testi
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            İlişkinizin farklı alanlardaki uyumunu ölçmek için hazırlanmış bir test
          </p>
        </div>

        <div className="mt-12 bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Test Hakkında</h2>
              <p className="mt-2 text-gray-500">
                Bu test, ilişkinizin farklı alanlardaki uyumunu ölçmek için tasarlanmıştır.
                Testi tamamladıktan sonra, partnerinize bir bağlantı gönderebilirsiniz.
                Partneriniz de testi tamamladığında, sonuçlarınızı birlikte görebilirsiniz.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Nasıl Çalışır?</h2>
              <ol className="mt-2 space-y-2 text-gray-500">
                <li>1. Testi başlatın ve soruları yanıtlayın</li>
                <li>2. Testi tamamladıktan sonra, partnerinize bir bağlantı gönderin</li>
                <li>3. Partneriniz testi tamamladığında, sonuçlarınızı birlikte görün</li>
              </ol>
            </div>

            {error && (
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
            )}

            <div>
              <button
                onClick={handleStartTest}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Başlatılıyor...
                  </span>
                ) : (
                  'Testi Başlat'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 