'use client'

import { useState } from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  image_url?: string
  created_at: string
}

interface MessageDisplayProps {
  message: Message
}

export default function MessageDisplay({ message }: MessageDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' && (
        <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-neon-blue/25">
          <Bot className="h-5 w-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
        <div className={`rounded-xl p-4 ${
          message.role === 'user' 
            ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/25' 
            : 'glass-card text-white border border-white/20 backdrop-blur-md'
        }`}>
          {message.image_url && (
            <div className="mb-3">
              <img
                src={message.image_url}
                alt="User uploaded"
                className="max-w-full max-h-64 rounded-xl border border-neon-blue/30 shadow-lg"
              />
            </div>
          )}
          
          {message.role === 'assistant' ? (
            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const inline = !match
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) {
                    return <div className="not-prose">{children}</div>
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-300 my-4">
                        {children}
                      </blockquote>
                    )
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-dark-600">
                          {children}
                        </table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return (
                      <th className="border border-dark-600 px-4 py-2 bg-dark-800 font-semibold text-left">
                        {children}
                      </th>
                    )
                  },
                  td({ children }) {
                    return (
                      <td className="border border-dark-600 px-4 py-2">
                        {children}
                      </td>
                    )
                  },
                  ul({ children }) {
                    return (
                      <ul className="list-disc list-inside my-2 space-y-1">
                        {children}
                      </ul>
                    )
                  },
                  ol({ children }) {
                    return (
                      <ol className="list-decimal list-inside my-2 space-y-1">
                        {children}
                      </ol>
                    )
                  },
                  p({ children }) {
                    return (
                      <p className="my-2 leading-relaxed">
                        {children}
                      </p>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-2 text-xs text-gray-400 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.created_at)}</span>
          {message.role === 'assistant' && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <div className="w-10 h-10 bg-gradient-to-br from-neon-green to-neon-blue rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-neon-green/25">
          <User className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  )
}
