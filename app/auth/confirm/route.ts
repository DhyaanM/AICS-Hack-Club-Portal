import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/setup-password'

    const redirectTo = request.nextUrl.clone()
    redirectTo.pathname = next
    redirectTo.searchParams.delete('token_hash')
    redirectTo.searchParams.delete('type')
    redirectTo.searchParams.delete('code')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(redirectTo)
        } else {
            console.error('Auth code exchange error:', error.message)
        }
    } else if (token_hash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (!error) {
            // Success! The user is now signed in via the token.
            return NextResponse.redirect(redirectTo)
        } else {
            console.error('Auth verification error:', error.message)
        }
    }

    // Fallback if token is invalid or missing
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('error', 'invalid_token')
    return NextResponse.redirect(loginUrl)
}
