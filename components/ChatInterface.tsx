'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Image as ImageIcon, Bot, User, Loader2 } from 'lucide-react'
import MessageDisplay from './MessageDisplay'
import ImageUpload from './ImageUpload'
// GPT-5 is the only model available

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  image_url?: string
  created_at: string
}

interface Chat {
  id: number
  title: string
  model: string
  created_at: string
  updated_at: string
}

interface ChatInterfaceProps {
  userId: number
  selectedChatId: number | null
  onChatSelect: (chatId: number | null) => void
  onNewChat?: () => void
}

export default function ChatInterface({
  userId,
  selectedChatId,
  onChatSelect,
  onNewChat,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const selectedModel = 'gpt-5' as const
  const [loadingStates, setLoadingStates] = useState<Map<number, boolean>>(new Map())
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedChatId) {
      fetchChatMessages(selectedChatId)
    } else {
      setMessages([])
      setCurrentChat(null)
    }
  }, [selectedChatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentChat(data.chat)
        setMessages(data.messages || [])
        setSelectedModel(data.chat.model)
      }
    } catch (error) {
      console.error('Failed to fetch chat messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() && !uploadedImage) return

    let chatId = selectedChatId
    
    try {

      // Create new chat if none selected
      if (!chatId) {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Chat',
            model: selectedModel,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          chatId = data.chat.id
          setCurrentChat(data.chat)
          onChatSelect(chatId)
          // Notify parent component to refresh chat list
          if (onNewChat) {
            onNewChat()
          }
        } else {
          throw new Error('Failed to create chat')
        }
      }

      // Set loading state for this chat
      setLoadingStates(prev => new Map(prev).set(chatId, true))

      // Send message
      const messageResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          model: selectedModel,
          imageUrl: uploadedImage,
        }),
      })

      if (messageResponse.ok) {
        const data = await messageResponse.json()
        
        // Clear input immediately
        setInputMessage('')
        setUploadedImage(null)

        // Refresh messages from server to get both user and assistant messages
        await fetchChatMessages(chatId)

        // Title will be updated automatically after 30 seconds on the server
      } else {
        const errorData = await messageResponse.json()
        throw new Error(errorData.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // You could show an error message to the user here
    } finally {
      setLoadingStates(prev => {
        const newMap = new Map(prev)
        if (chatId) {
          newMap.delete(chatId)
        }
        return newMap
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleImageUpload = (imageData: string) => {
    setUploadedImage(imageData)
  }

  const removeImage = () => {
    setUploadedImage(null)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      {currentChat && (
        <div className="border-b border-white/10 glass-card p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">{currentChat.title}</h1>
              <p className="text-sm text-gray-300">
                Model: GPT-5
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loadingStates.get(selectedChatId || 0) && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="h-24 w-24 text-accent-blue mx-auto mb-8 animate-float shadow-lg shadow-accent-blue/20" />
              <h2 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-indigo bg-clip-text text-transparent">
                Welcome to xNode GPT
              </h2>
              <p className="text-zinc-300 max-w-lg mb-12 text-xl font-light leading-relaxed">
                Start a conversation by typing a message below. You can also upload images for AI vision analysis.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageDisplay key={message.id} message={message} />
        ))}

        {loadingStates.get(selectedChatId || 0) && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-blue via-accent-purple to-accent-indigo rounded-2xl flex items-center justify-center shadow-xl shadow-accent-blue/30 animate-luxury-glow">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
              <span className="text-zinc-300 font-medium">Processing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-600/30 glass-card p-6 backdrop-blur-xl">
        {uploadedImage && (
          <div className="mb-4 relative">
            <div className="relative inline-block">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="max-w-xs max-h-48 rounded-xl border border-neon-blue/30 shadow-lg"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-neon-red text-white rounded-full p-1 hover:bg-neon-red/80 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <ImageUpload onImageUpload={handleImageUpload} />
          
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="input resize-none h-12 pr-12"
              rows={1}
              disabled={loadingStates.get(selectedChatId || 0)}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={loadingStates.get(selectedChatId || 0) || (!inputMessage.trim() && !uploadedImage)}
            className="btn btn-primary px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-accent-blue/10 hover:shadow-2xl hover:shadow-accent-blue/20"
          >
            {loadingStates.get(selectedChatId || 0) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
