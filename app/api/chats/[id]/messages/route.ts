import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/database'
import { generateChatResponse, generateChatTitle } from '@/lib/openai'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const chatId = parseInt(params.id)
    if (isNaN(chatId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid chat ID' },
        { status: 400 }
      )
    }

    const { message, model, imageUrl } = await request.json()

    if (!message || !model) {
      return NextResponse.json(
        { success: false, message: 'Message and model are required' },
        { status: 400 }
      )
    }

    const chat = await db.getChatById(chatId)
    
    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      )
    }

    // Add user message
    await db.addMessage(chatId, 'user', message, imageUrl)

    // Get all messages for context
    const messages = await db.getChatMessages(chatId)
    
    // Schedule title generation for first message with 30 second delay
    if (messages.length === 1) {
      setTimeout(async () => {
        try {
          const title = await generateChatTitle(message)
          await db.updateChatTitle(chatId, title)
          console.log('Updated chat title after 30 seconds:', title)
        } catch (error) {
          console.error('Error updating chat title:', error)
        }
      }, 30000) // 30 seconds delay
    }

    // Prepare messages for OpenAI
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.image_url 
        ? [
            { type: "text", text: msg.content },
            { type: "image_url", image_url: { url: msg.image_url } }
          ]
        : msg.content,
    }))

    // Generate response from OpenAI
    console.log('Generating response for model:', model);
    console.log('OpenAI messages:', JSON.stringify(openaiMessages, null, 2));
    
    const response = await generateChatResponse(openaiMessages, model)

    if (response.error) {
      console.error('OpenAI response error:', response.error);
      return NextResponse.json(
        { success: false, message: response.error },
        { status: 500 }
      )
    }

    // Add assistant message
    const assistantMessage = await db.addMessage(chatId, 'assistant', response.content)

    // Update chat timestamp
    await db.updateChatTitle(chatId, chat.title) // This also updates the timestamp

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
