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
  const [refreshChats, setRefreshChats] = useState(0)
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
    setRefreshChats(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-blue shadow-lg shadow-accent-blue/20"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-800 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-indigo bg-clip-text text-transparent animate-float">
              xNode GPT
            </h1>
            <p className="text-zinc-300 text-xl font-light">Advanced AI Interface</p>
          </div>
          <AuthForm onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-800 flex">
      <Sidebar
        user={user}
        selectedChatId={selectedChatId}
        onChatSelect={setSelectedChatId}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        refreshTrigger={refreshChats}
      />
      <main className="flex-1 flex flex-col">
        <ChatInterface
          userId={user.id}
          selectedChatId={selectedChatId}
          onChatSelect={setSelectedChatId}
          onNewChat={handleNewChat}
        />
      </main>
    </div>
  )
}
