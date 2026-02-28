import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function getEmailTemplate(title: string, memberName: string, contentHtml: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f0a1e;
            color: #ffffff;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a0a2e;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #ec3750, #a633d6);
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 30px;
            color: #e2e8f0;
          }
          .content h2 {
            color: #ffffff;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .detail-row {
            margin-bottom: 16px;
          }
          .detail-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #ec3750;
            font-weight: bold;
            display: block;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: 16px;
            line-height: 1.5;
            color: #ffffff;
            margin: 0;
            background-color: rgba(0, 0, 0, 0.2);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AICS Hack Club Portal</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <div class="detail-row">
              <span class="detail-label">Member</span>
              <p class="detail-value"><strong>${memberName}</strong></p>
            </div>
            ${contentHtml}
          </div>
          <div class="footer">
            AICS Hack Club Portal • System Notification<br>
            Please review this request on the Leader Dashboard.
          </div>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: Request) {
  try {
    const { type, memberName, details } = await request.json()

    let subject = ''
    let text = ''
    let html = ''

    if (type === 'project') {
      subject = `New Project Proposal: ${details.title}`
      text = `${memberName} has submitted a new project proposal:\n\nTitle: ${details.title}\nCategory: ${details.category}\nDescription: ${details.description}`
      html = getEmailTemplate(
        "New Project Proposal",
        memberName,
        `
          <div class="detail-row">
            <span class="detail-label">Project Title</span>
            <p class="detail-value">${details.title}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <p class="detail-value">${details.category}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description</span>
            <p class="detail-value">${details.description}</p>
          </div>
        `
      )
    } else if (type === 'leave') {
      subject = `Leave Request: ${memberName}`
      text = `${memberName} has requested a leave of absence:\n\nDate: ${details.date}\nReason: ${details.reason}`
      html = getEmailTemplate(
        "Leave Request",
        memberName,
        `
          <div class="detail-row">
            <span class="detail-label">Meeting / Date</span>
            <p class="detail-value">${details.date}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reason</span>
            <p class="detail-value">${details.reason}</p>
          </div>
        `
      )
    } else if (type === 'report') {
      subject = `Problem Report: ${details.category}`
      text = `${memberName} reported an issue:\n\nTitle: ${details.title}\nCategory: ${details.category}\nDescription: ${details.description}`
      html = getEmailTemplate(
        "New Problem Report",
        memberName,
        `
          <div class="detail-row">
            <span class="detail-label">Report Title</span>
            <p class="detail-value">${details.title}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <p class="detail-value">${details.category}</p>
          </div>
          <div class="detail-row">
            <span class="detail-label">Details</span>
            <p class="detail-value">${details.description}</p>
          </div>
        `
      )
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: 'AICS Hack Club <onboarding@resend.dev>',
      to: ['dhyaanmanganahalli@gmail.com'],
      subject,
      text,
      html,
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
