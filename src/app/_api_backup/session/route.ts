import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const sessionId = cookieStore.get('uploadSessionId')
  
  return NextResponse.json({
    hasUploadedData: !!sessionId?.value,
    sessionId: sessionId?.value
  })
}

export async function POST(request: NextRequest) {
  const { sessionId } = await request.json()
  
  const response = NextResponse.json({ success: true })
  response.cookies.set('uploadSessionId', sessionId, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  return response
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('uploadSessionId')
  
  return response
}