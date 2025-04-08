'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WaitingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [partnerStatus, setPartnerStatus] = useState<'waiting' | 'completed'>('waiting')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const id = searchParams.get('sessionId')
    if (!id) {
      setError('Geçersiz oturum')
      setLoading(false)
      return
    }
    setSessionId(id)
  }, [searchParams])

  useEffect(() => {
    if (sessionId) {
      checkPartnerStatus()
    }
  }, [sessionId])

  const checkPartnerStatus = async () => {
    if (!sessionId) return

    try {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('status')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      if (data.status === 'completed') {
        router.push(`/result/${sessionId}`)
      } else {
        setPartnerStatus('waiting')
        // 10 saniyede bir kontrol et
        setTimeout(checkPartnerStatus, 10000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    if (!sessionId) return
    const inviteLink = `${window.location.origin}/test/partner?sessionId=${sessionId}`
    await navigator.clipboard.writeText(inviteLink)
    alert('Davet bağlantısı kopyalandı!')
  }

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId || !email) return

    setSending(true)
    try {
      const inviteLink = `${window.location.origin}/test/partner?sessionId=${sessionId}`
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('email_invites')
        .insert({
          session_id: sessionId,
          sender_email: user?.email,
          recipient_email: email,
          status: 'pending'
        })

      if (error) throw error

      // E-posta gönderme işlemi
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'CoupleFin - Finansal Uyumluluk Testi Daveti',
          text: `Merhaba,\n\n${user?.email} sizi finansal uyumluluk testine davet ediyor. Aşağıdaki bağlantıya tıklayarak teste katılabilirsiniz:\n\n${inviteLink}\n\nSevgiler,\nCoupleFin Ekibi`
        }),
      })

      if (!response.ok) throw new Error('E-posta gönderilemedi')

      alert('E-posta başarıyla gönderildi!')
      setShowEmailModal(false)
      setEmail('')
    } catch (err) {
      setError('E-posta gönderilirken bir hata oluştu')
      console.error('Error sending email:', err)
    } finally {
      setSending(false)
    }
  }

  const shareViaWhatsApp = () => {
    if (!sessionId) return
    const inviteLink = `${window.location.origin}/test/partner?sessionId=${sessionId}`
    const text = `Merhaba! Seninle finansal uyumluluğumuzu test etmek istiyorum. Bu bağlantıya tıklayarak teste katılabilirsin: ${inviteLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
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
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Partnerinizi Bekleyin</h2>
            <p className="text-gray-600">
              Partneriniz testi tamamladığında sonuçlarınızı görebileceksiniz.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Partnerinizi Davet Edin</h3>
            <div className="space-y-4">
              <button
                onClick={copyInviteLink}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Davet Bağlantısını Kopyala
              </button>

              <button
                onClick={() => setShowEmailModal(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                E-posta ile Gönder
              </button>

              <button
                onClick={shareViaWhatsApp}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp ile Paylaş
              </button>
            </div>
          </div>

          {/* E-posta Modal */}
          {showEmailModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">E-posta ile Davet Gönder</h3>
                <form onSubmit={sendEmail}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Partner E-posta Adresi
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {sending ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>Bu sayfa otomatik olarak yenilenecek...</p>
          </div>
        </div>
      </div>
    </div>
  )
} 