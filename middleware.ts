import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  // Get session from cookies
  const accessToken = req.cookies.get('sb-access-token')?.value
  const refreshToken = req.cookies.get('sb-refresh-token')?.value

  if (accessToken && refreshToken) {
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (session) {
      // Refresh the session and set the cookies with 7 days duration
      res.cookies.set('sb-access-token', session.access_token, {
        path: '/',
        maxAge: 604800, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      res.cookies.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        maxAge: 604800, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    } else {
      // If tokens are present but invalid, clear them
      res.cookies.delete('sb-access-token')
      res.cookies.delete('sb-refresh-token')
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/kasir/:path*', '/profile/:path*'],
}
