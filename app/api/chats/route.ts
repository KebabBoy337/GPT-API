import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const chats = await db.getUserChats(user.id)
    
    return NextResponse.json({
      success: true,
      chats,
    })
  } catch (error) {
    console.error('Get chats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { title, model } = await request.json()

    if (!title || !model) {
      return NextResponse.json(
        { success: false, message: 'Title and model are required' },
        { status: 400 }
      )
    }

    const chat = await db.createChat(user.id, title, model)
    
    return NextResponse.json({
      success: true,
      chat,
    })
  } catch (error) {
    console.error('Create chat error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
