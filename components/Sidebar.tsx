'use client'

import { useState, useEffect } from 'react'
import { Plus, MessageSquare, Settings, LogOut, Trash2 } from 'lucide-react'
import { AuthUser } from '@/lib/auth'

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
}

export default function Sidebar({
  user,
  selectedChatId,
  onChatSelect,
  onNewChat,
  onLogout,
}: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [])

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

  return (
    <div className="w-80 bg-dark-900 border-r border-dark-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <button
          onClick={onNewChat}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user.username}</p>
            <p className="text-gray-400 text-sm truncate">{user.email}</p>
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
          <div className="p-4 text-center text-gray-400">
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
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChatId === chat.id
                    ? 'bg-primary-600/20 border border-primary-500/30'
                    : 'hover:bg-dark-800'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700">
        <button
          onClick={onLogout}
          className="btn btn-ghost w-full flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            xNode GPT v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
          </p>
        </div>
      </div>
    </div>
  )
}
