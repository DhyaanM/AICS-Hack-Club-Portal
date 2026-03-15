import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        return supabaseResponse
    }

    // Next.js 16.1+ requires awaiting cookies
    const cookieStore = await request.cookies

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                // Set cookies on the incoming request so the supabase client session is up to date
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                )
                
                // Refresh the response object with the updated request before setting outgoing cookies
                supabaseResponse = NextResponse.next({ request })

                // Set cookies on the outgoing response with security flags
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, {
                        ...(options as object),
                        httpOnly: true,
                        secure: true,
                        sameSite: 'lax',
                    })
                )
            },
        },
    })

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const path = request.nextUrl.pathname

        // Protected routes
        const isAuthPath = path.startsWith("/auth") || path.startsWith("/setup-password")
        if (!user && (path.startsWith("/leaders") || path.startsWith("/members")) && !isAuthPath) {
            const url = request.nextUrl.clone()
            url.pathname = "/login"
            return NextResponse.redirect(url)
        }

        // Redirect logged-in users away from login
        if (user && path.startsWith("/login")) {
            const url = request.nextUrl.clone()
            url.pathname = "/members"
            return NextResponse.redirect(url)
        }
    } catch (e) {
        // Silently fail to ensure the application still loads
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
