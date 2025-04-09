export interface User {
  id: string
  email?: string
  user_metadata?: {
    [key: string]: any
  }
  app_metadata?: {
    [key: string]: any
  }
  aud?: string
  created_at?: string
  role?: string
  updated_at?: string
}

export interface TestSession {
  id: string
  user_id: string
  status: 'pending' | 'completed'
  created_at: string
}

export interface TestAnswer {
  question_id: string
  answer_value: number
  is_partner: boolean
  session_id: string
} 