import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ZENDESK_DOMAIN = process.env.ZENDESK_DOMAIN
    const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL
    const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN

    if (!ZENDESK_DOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
      return NextResponse.json({ error: "Missing Zendesk configuration" }, { status: 500 })
    }

    const auth = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString("base64")

    const response = await fetch(`https://${ZENDESK_DOMAIN}/api/v2/users/${params.id}.json`, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Zendesk API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
