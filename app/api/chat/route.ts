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

      const result = streamText({
        model: azure("gpt-4o"),
        system: `You are a helpful AI assistant with access to various tools. When a user asks you to chain or sequence multiple operations:

1. ALWAYS execute ALL requested tools in the specified order
2. Use the output from one tool as the input to the next tool
3. Continue making tool calls until all requested operations are complete
4. If a user asks for step-by-step operations, execute each step sequentially
5. Don't stop after the first tool call - continue with subsequent tools using previous results

For example, if asked to "echo 'hello' then reverse the result then uppercase it":
- First call echo with 'hello'
- Then call reverse with the echo result
- Then call uppercase with the reverse result

Always complete the full chain of operations as requested.`,
        messages,
        tools,
        maxSteps: 10, // Allow multiple sequential tool calls
        onFinish: async () => {
          console.log("Stream finished")
          // Close MCP client when response is finished
          if (mcpClient) {
            await mcpClient.close()
          }
        },
        onError: async (error) => {
          console.error("Stream error:", error)
          // Close MCP client on error
          if (mcpClient) {
            await mcpClient.close()
          }
        },
      })

      return result.toDataStreamResponse()
    } catch (mcpError) {
      console.error("MCP Client Error:", mcpError)

      // Fallback to regular AI response without MCP tools
      console.log("Falling back to regular AI response")
      const result = streamText({
        model: azure("gpt-4o"),
        system: `You are a helpful AI assistant. When users ask about tool operations or chaining, explain that MCP tools are not currently available and suggest they check the configuration.`,
        messages,
        maxSteps: 10,
      })

      return result.toDataStreamResponse()
    }
  } catch (error) {
    console.error("API Route Error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
