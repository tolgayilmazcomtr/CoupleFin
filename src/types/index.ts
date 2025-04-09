export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  is_premium: boolean
}

export interface TestSession {
  id: string
  user_id: string
  partner_id: string | null
  created_at: string
  updated_at: string
  status: 'pending' | 'completed'
  answers: Record<string, number>
  partner_answers: Record<string, number> | null
}

export interface TestAnswer {
  id: string
  session_id: string
  user_id: string
  question_id: string
  answer: number
  created_at: string
}

export interface PremiumContent {
  id: string
  title: string
  description: string
  type: 'pdf' | 'ai' | 'template' | 'ebook'
  content_url: string
  created_at: string
} 