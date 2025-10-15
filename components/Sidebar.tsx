'use client'

import { useState, useEffect } from 'react'
import { Plus, MessageSquare, Settings, LogOut, Trash2 } from 'lucide-react'
import { AuthUser } from '@/lib/auth'
import { generateAvatar } from '@/lib/avatars'

interface Chat {
  id: number
  title: string
  model: string
  created_at: string
  updated_at: string
}

interface SidebarProps {
  user: AuthUser
  selectedChatId: number | null
  onChatSelect: (chatId: number | null) => void
  onNewChat: () => void
  onLogout: () => void
  refreshTrigger?: number
}

export default function Sidebar({
  user,
  selectedChatId,
  onChatSelect,
  onNewChat,
  onLogout,
  refreshTrigger,
}: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchChats()
    }
  }, [refreshTrigger])

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats')
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats || [])
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return
    }

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setChats(chats.filter(chat => chat.id !== chatId))
        if (selectedChatId === chatId) {
          onChatSelect(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const userAvatar = generateAvatar(user.username);

  return (
    <div className="w-80 glass-card border-r border-white/10 flex flex-col h-screen backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewChat}
          className="btn btn-primary w-full flex items-center justify-center gap-2 animate-glow"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${userAvatar.color} shadow-lg shadow-${userAvatar.color.split('-')[1]}-500/25 animate-float`}>
            <span className="text-white font-bold text-lg">
              {userAvatar.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user.username}</p>
            <p className="text-gray-300 text-sm truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-gray-300">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No chats yet</p>
            <p className="text-sm">Start a new conversation</p>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                  selectedChatId === chat.id
                    ? 'bg-glass-300 border border-neon-blue/50 shadow-lg shadow-neon-blue/20'
                    : 'hover:bg-glass-200 border border-transparent hover:border-white/20'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {chat.title}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {formatDate(chat.updated_at)} • {chat.model}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-neon-red transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="btn btn-ghost w-full flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
        <div className="text-center mt-3">
          <p className="text-xs text-gray-400">
            xNode GPT v{process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0'}
          </p>
        </div>
      </div>
    </div>
  )
}
