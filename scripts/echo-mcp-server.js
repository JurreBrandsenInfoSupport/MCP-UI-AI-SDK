#!/usr/bin/env node

// Basic Echo MCP Server
// This server provides simple tools for testing MCP functionality

class MCPServer {
  constructor() {
    this.tools = {
      echo: {
        name: "echo",
        description: "Echo back the input text",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to echo back",
            },
          },
          required: ["text"],
        },
      },
      reverse: {
        name: "reverse",
        description: "Reverse the input text",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to reverse",
            },
          },
          required: ["text"],
        },
      },
      uppercase: {
        name: "uppercase",
        description: "Convert text to uppercase",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to convert to uppercase",
            },
          },
          required: ["text"],
        },
      },
      count_words: {
        name: "count_words",
        description: "Count the number of words in the text",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to count words in",
            },
          },
          required: ["text"],
        },
      },
      generate_greeting: {
        name: "generate_greeting",
        description: "Generate a personalized greeting",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the person to greet",
            },
            style: {
              type: "string",
              enum: ["formal", "casual", "friendly"],
              description: "Style of greeting",
            },
          },
          required: ["name"],
        },
      },
    }
  }

  async handleRequest(request) {
    const { method, params } = request

    switch (method) {
      case "initialize":
        return {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "echo-mcp-server",
            version: "1.0.0",
          },
        }

      case "tools/list":
        return {
          tools: Object.values(this.tools),
        }

      case "tools/call":
        return await this.callTool(params.name, params.arguments || {})

      default:
        throw new Error(`Unknown method: ${method}`)
    }
  }

  async callTool(toolName, args) {
    switch (toolName) {
      case "echo":
        return {
          content: [
            {
              type: "text",
              text: `Echo: ${args.text}`,
            },
          ],
        }

      case "reverse":
        return {
          content: [
            {
              type: "text",
              text: args.text.split("").reverse().join(""),
            },
          ],
        }

      case "uppercase":
        return {
          content: [
            {
              type: "text",
              text: args.text.toUpperCase(),
            },
          ],
        }

      case "count_words":
        const wordCount = args.text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length
        return {
          content: [
            {
              type: "text",
              text: `Word count: ${wordCount}`,
            },
          ],
        }

      case "generate_greeting":
        const { name, style = "friendly" } = args
        let greeting

        switch (style) {
          case "formal":
            greeting = `Good day, ${name}. I hope this message finds you well.`
            break
          case "casual":
            greeting = `Hey ${name}! What's up?`
            break
          case "friendly":
          default:
            greeting = `Hello ${name}! Nice to meet you!`
            break
        }

        return {
          content: [
            {
              type: "text",
              text: greeting,
            },
          ],
        }

      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  start() {
    console.error("Echo MCP Server starting...")

    process.stdin.setEncoding("utf8")

    let buffer = ""

    process.stdin.on("data", (chunk) => {
      buffer += chunk

      // Process complete JSON-RPC messages
      const lines = buffer.split("\n")
      buffer = lines.pop() || "" // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line)
            this.handleRequest(request)
              .then((result) => {
                const response = {
                  jsonrpc: "2.0",
                  id: request.id,
                  result,
                }
                console.log(JSON.stringify(response))
              })
              .catch((error) => {
                const response = {
                  jsonrpc: "2.0",
                  id: request.id,
                  error: {
                    code: -32603,
                    message: error.message,
                  },
                }
                console.log(JSON.stringify(response))
              })
          } catch (error) {
            console.error("Failed to parse JSON:", error.message)
          }
        }
      }
    })

    process.stdin.on("end", () => {
      console.error("Echo MCP Server shutting down...")
      process.exit(0)
    })
  }
}

// Start the server
const server = new MCPServer()
server.start()
