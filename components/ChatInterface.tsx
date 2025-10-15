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
  const [loading, setLoading] = useState(false)
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

    setLoading(true)

    try {
      let chatId = selectedChatId

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
        
        // Add user message to UI immediately
        const userMessage: Message = {
          id: Date.now(),
          role: 'user',
          content: inputMessage,
          image_url: uploadedImage || undefined,
          created_at: new Date().toISOString(),
        }
        
        setMessages(prev => [...prev, userMessage])
        setInputMessage('')
        setUploadedImage(null)

        // Add assistant response
        if (data.message) {
          setMessages(prev => [...prev, data.message])
        }
      } else {
        const errorData = await messageResponse.json()
        throw new Error(errorData.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // You could show an error message to the user here
    } finally {
      setLoading(false)
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
    <div className="flex flex-col h-screen bg-gray-950">
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
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="h-20 w-20 text-neon-blue mx-auto mb-6 animate-float" />
              <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                Welcome to xNode GPT
              </h2>
              <p className="text-gray-300 max-w-md mb-8 text-lg">
                Start a conversation by typing a message below. You can also upload images for GPT Vision.
              </p>
              <div className="glass-card p-6 rounded-2xl border border-neon-blue/30 max-w-sm mx-auto neon-border">
                <label className="block text-sm font-medium text-white mb-3">
                  Select Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as GPTModel)}
                  className="input w-full"
                >
                  {GPT_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageDisplay key={message.id} message={message} />
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center shadow-lg shadow-accent-blue/25">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
              <span className="text-gray-300">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 glass-card p-4 backdrop-blur-xl">
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
              disabled={loading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={loading || (!inputMessage.trim() && !uploadedImage)}
            className="btn btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed animate-glow"
          >
            {loading ? (
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
