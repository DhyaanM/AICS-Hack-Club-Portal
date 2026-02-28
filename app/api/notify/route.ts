import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
    try {
        const { type, memberName, details } = await request.json()

        let subject = ''
        let text = ''

        if (type === 'project') {
            subject = `New Project Proposal from ${memberName}`
            text = `${memberName} has submitted a new project proposal:\n\nTitle: ${details.title}\nCategory: ${details.category}\nDescription: ${details.description}`
        } else if (type === 'leave') {
            subject = `New Leave Request from ${memberName}`
            text = `${memberName} has requested a leave of absence:\n\nDate: ${details.date}\nReason: ${details.reason}`
        } else if (type === 'report') {
            subject = `New Problem Report by ${memberName}`
            text = `${memberName} reported an issue:\n\nTitle: ${details.title}\nCategory: ${details.category}\nDescription: ${details.description}`
        } else {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
        }

        const { data, error } = await resend.emails.send({
            from: 'AICS Hack Club <onboarding@resend.dev>',
            to: ['dhyaanmanganahalli@gmail.com'],
            subject,
            text,
        })

        if (error) {
            console.error("Resend error:", error)
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Error sending notification:", error)
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }
}
