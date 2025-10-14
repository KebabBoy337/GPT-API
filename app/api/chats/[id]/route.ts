import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(
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

    const chat = await db.getChatById(chatId)
    
    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      )
    }

    const messages = await db.getChatMessages(chatId)
    
    return NextResponse.json({
      success: true,
      chat,
      messages,
    })
  } catch (error) {
    console.error('Get chat error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const chat = await db.getChatById(chatId)
    
    if (!chat || chat.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      )
    }

    await db.deleteChat(chatId)
    
    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
    })
  } catch (error) {
    console.error('Delete chat error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
