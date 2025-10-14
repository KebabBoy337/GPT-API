'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import ChatInterface from '@/components/ChatInterface'
import Sidebar from '@/components/Sidebar'
import { AuthUser } from '@/lib/auth'

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData: AuthUser) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setSelectedChatId(null)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNewChat = () => {
    setSelectedChatId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">xNode GPT</h1>
            <p className="text-gray-400">Advanced ChatGPT Interface</p>
          </div>
          <AuthForm onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <Sidebar
        user={user}
        selectedChatId={selectedChatId}
        onChatSelect={setSelectedChatId}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col">
        <ChatInterface
          userId={user.id}
          selectedChatId={selectedChatId}
          onChatSelect={setSelectedChatId}
        />
      </main>
    </div>
  )
}
