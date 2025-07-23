import { type NextRequest, NextResponse } from "next/server"
import { zendeskClient } from "@/lib/zendesk-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "ticket"

    if (!query) {
      return NextResponse.json({ error: "Zoekterm is vereist" }, { status: 400 })
    }

    try {
      const response = await zendeskClient.search(`${query} type:${type}`)

      return NextResponse.json({
        results: response.results || [],
        count: response.count || 0,
      })
    } catch (error) {
      console.error("Zendesk zoeken mislukt:", error)
      return NextResponse.json({ error: "Zoeken mislukt" }, { status: 500 })
    }
  } catch (error) {
    console.error("API fout:", error)
    return NextResponse.json({ error: "Zoeken mislukt" }, { status: 500 })
  }
}
