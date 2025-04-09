'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { User } from '@/types'

interface PremiumContent {
  id: string
  title: string
  description: string
  type: 'pdf' | 'ai' | 'template' | 'ebook'
  url: string
}

export default function PremiumPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<PremiumContent[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        setIsPremium(data?.is_premium || false)

        if (data?.is_premium) {
          const { data: contentData, error: contentError } = await supabase
            .from('premium_content')
            .select('*')

          if (contentError) throw contentError
          setContent(contentData || [])
        }
      } catch (err) {
        setError('Premium içerikler yüklenirken bir hata oluştu')
        console.error('Error loading premium content:', err)
      } finally {
        setLoading(false)
      }
    }

    checkPremiumStatus()
  }, [router])

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄'
      case 'ai':
        return '🤖'
      case 'template':
        return '📋'
      case 'ebook':
        return '📚'
      default:
        return '📄'
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

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Premium Üyelik Gerekli</h1>
            <p className="text-gray-600 mb-6">
              Bu içeriklere erişmek için premium üye olmanız gerekiyor.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Premium&apos;a Yükselt
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Premium İçerikler</h1>
        <div className="grid grid-cols-1 gap-6">
          {content.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start">
                <span className="text-3xl mr-4">{getIcon(item.type)}</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h2>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    İçeriği Görüntüle
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 