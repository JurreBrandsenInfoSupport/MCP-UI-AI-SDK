import { experimental_createMCPClient, streamText } from "ai"
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio"
import { azure } from "@ai-sdk/azure"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, mcpConfig } = await req.json()

    console.log("Received request:", { messages, mcpConfig })

    let mcpClient

    try {
      // Create MCP client based on configuration
      if (mcpConfig?.type === "stdio") {
        console.log("Creating stdio MCP client...")
        const transport = new Experimental_StdioMCPTransport({
          command: mcpConfig.command || "node",
          args: mcpConfig.args || ["server.js"],
        })
        mcpClient = await experimental_createMCPClient({ transport })
        console.log("MCP client created successfully")
      } else if (mcpConfig?.type === "sse") {
        console.log("Creating SSE MCP client...")
        mcpClient = await experimental_createMCPClient({
          transport: {
            type: "sse",
            url: mcpConfig.url || "http://localhost:3000/sse",
          },
        })
        console.log("MCP client created successfully")
      }

      // Get tools from MCP server if client is available
      const tools = mcpClient ? await mcpClient.tools() : {}
      console.log("Available tools:", Object.keys(tools))

      const result = await streamText({
        model: azure("gpt-4.1"),
        messages,
        tools: mcpConfig?.type !== "none" ? tools : undefined,
      })

      return result.toDataStreamResponse()
    } catch (mcpError) {
      console.error("MCP Client Error:", mcpError)

      // Fallback to regular AI response without MCP tools
      console.log("Falling back to regular AI response")
      const result = await streamText({
        model: azure("gpt-4.1"),
        messages,
      })

      return result.toDataStreamResponse()
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
