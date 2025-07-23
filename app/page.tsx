"use client"

import { useChat } from "ai/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, MessageSquare, Wrench, AlertCircle, ArrowRight } from "lucide-react"

interface MCPConfig {
  type: "none" | "stdio" | "sse"
  url?: string
  command?: string
  args?: string[]
}

export default function MCPToolsChat() {
  const [mcpConfig, setMcpConfig] = useState<MCPConfig>({ type: "none" })
  const [sseUrl, setSseUrl] = useState("http://localhost:3000/sse")
  const [stdioCommand, setStdioCommand] = useState("node")
  const [stdioArgs, setStdioArgs] = useState("scripts/echo-mcp-server.js")

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { mcpConfig },
    onError: (error) => {
      console.error("Chat error:", error)
    },
    onFinish: (message) => {
      console.log("Message finished:", message)
    },
  })

  const updateMcpConfig = () => {
    const config: MCPConfig = { type: mcpConfig.type }

    if (mcpConfig.type === "sse") {
      config.url = sseUrl
    } else if (mcpConfig.type === "stdio") {
      config.command = stdioCommand
      config.args = stdioArgs.split(" ").filter((arg) => arg.trim())
    }

    setMcpConfig(config)
    console.log("Updated MCP config:", config)
  }

  // Quick action buttons for common chained operations
  const quickActions = [
    {
      label: "Chain: Echo → Reverse → Uppercase",
      prompt:
        "Please chain these operations step by step: 1) First echo 'hello world', 2) Then reverse the result from step 1, 3) Then uppercase the result from step 2. Use the output from each step as input to the next step.",
    },
    {
      label: "Chain: Generate → Count → Echo",
      prompt:
        "Please chain these operations: 1) Generate a greeting message, 2) Count the words in that generated message, 3) Echo back the word count result. Pass the output from each step to the next.",
    },
    {
      label: "Chain: Reverse → Echo → Uppercase",
      prompt:
        "Chain these tools step by step: 1) Reverse the text 'AI SDK', 2) Echo the reversed result, 3) Convert the echoed result to uppercase. Each step should use the output from the previous step.",
    },
  ]

  const handleQuickAction = (prompt: string) => {
    // Set the input and trigger form submission
    const event = new Event("submit", { bubbles: true, cancelable: true })
    const form = document.querySelector("form")
    if (form) {
      const inputElement = form.querySelector('input[type="text"]') as HTMLInputElement
      if (inputElement) {
        inputElement.value = prompt
        handleInputChange({ target: { value: prompt } } as any)
        setTimeout(() => {
          form.dispatchEvent(event)
        }, 100)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Wrench className="h-8 w-8 text-blue-600" />
            MCP Tools Chat
          </h1>
          <p className="text-gray-600">Chat with AI using Model Context Protocol (MCP) tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                MCP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mcp-type">Transport Type</Label>
                <Select
                  value={mcpConfig.type}
                  onValueChange={(value: "none" | "stdio" | "sse") => setMcpConfig({ ...mcpConfig, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No MCP Tools</SelectItem>
                    <SelectItem value="sse">Server-Sent Events</SelectItem>
                    <SelectItem value="stdio">Standard I/O</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mcpConfig.type === "sse" && (
                <div>
                  <Label htmlFor="sse-url">SSE Server URL</Label>
                  <Input
                    id="sse-url"
                    value={sseUrl}
                    onChange={(e) => setSseUrl(e.target.value)}
                    placeholder="http://localhost:3000/sse"
                  />
                </div>
              )}

              {mcpConfig.type === "stdio" && (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="stdio-command">Command</Label>
                    <Input
                      id="stdio-command"
                      value={stdioCommand}
                      onChange={(e) => setStdioCommand(e.target.value)}
                      placeholder="node"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stdio-args">Arguments</Label>
                    <Input
                      id="stdio-args"
                      value={stdioArgs}
                      onChange={(e) => setStdioArgs(e.target.value)}
                      placeholder="scripts/echo-mcp-server.js"
                    />
                  </div>
                </div>
              )}

              <Button onClick={updateMcpConfig} className="w-full" size="sm">
                Apply Configuration
              </Button>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium">Status:</span>
                  <Badge variant={mcpConfig.type === "none" ? "secondary" : "default"}>
                    {mcpConfig.type === "none" ? "No MCP" : `MCP ${mcpConfig.type.toUpperCase()}`}
                  </Badge>
                </div>
                {mcpConfig.type !== "none" && (
                  <p className="text-xs text-gray-500">MCP tools will be available to the AI assistant</p>
                )}
              </div>

              {/* Quick Actions */}
              {mcpConfig.type !== "none" && (
                <div className="pt-2 border-t">
                  <Label className="text-xs font-medium mb-2 block">Quick Tool Chains:</Label>
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-auto py-2 px-2 bg-transparent"
                        onClick={() => handleQuickAction(action.prompt)}
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-left">{action.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
                {error && (
                  <Badge variant="destructive" className="ml-auto">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{error.message}</p>
                  </div>
                )}

                {messages.length === 0 && !error && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Start a conversation with the AI assistant</p>
                    {mcpConfig.type !== "none" && (
                      <div className="mt-4">
                        <p className="text-sm mt-2">MCP tools are enabled and ready to use</p>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-2">💡 Tool Chaining Tip:</p>
                          <p className="text-xs text-blue-700">
                            To chain tools together, be explicit: "First do X, then use that result for Y, then use that
                            result for Z"
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Try the quick actions on the left, or ask:</p>
                      <p>"Chain: echo 'hello' → reverse result → uppercase result"</p>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-900 shadow-sm border"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.toolInvocations && message.toolInvocations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs text-gray-500">
                              Tool Chain ({message.toolInvocations.length} steps):
                            </p>
                            <div className="flex items-center gap-1">
                              {message.toolInvocations.map((_, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  {index < message.toolInvocations.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-gray-400 mx-1" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {message.toolInvocations.map((tool, index) => {
                              // Extract content from tool result
                              let displayContent = "No result"
                              let hasError = false

                              if (tool.result) {
                                try {
                                  // Handle different result formats
                                  if (typeof tool.result === "string") {
                                    displayContent = tool.result
                                  } else if (tool.result.content) {
                                    // Handle MCP format with content array
                                    if (Array.isArray(tool.result.content)) {
                                      displayContent = tool.result.content
                                        .map((item: any) => item.text || item.content || JSON.stringify(item))
                                        .join(" ")
                                    } else if (typeof tool.result.content === "string") {
                                      displayContent = tool.result.content
                                    } else {
                                      displayContent = JSON.stringify(tool.result.content)
                                    }
                                  } else if (tool.result.text) {
                                    displayContent = tool.result.text
                                  } else if (tool.result.error) {
                                    displayContent = `Error: ${tool.result.error}`
                                    hasError = true
                                  } else {
                                    // Fallback for other formats
                                    displayContent = JSON.stringify(tool.result)
                                  }
                                } catch (e) {
                                  displayContent = `Error parsing result: ${String(tool.result)}`
                                  hasError = true
                                }
                              } else if (tool.state === "call") {
                                displayContent = "Tool called, waiting for result..."
                              }

                              return (
                                <div key={index} className="border rounded-md p-2 bg-gray-50 relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                          {index + 1}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {tool.toolName}
                                        </Badge>
                                      </div>
                                      {index > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          Uses output from step {index}
                                        </Badge>
                                      )}
                                    </div>
                                    {tool.args && (
                                      <Badge variant="secondary" className="text-xs">
                                        {Object.keys(tool.args).length} args
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Show tool arguments if available */}
                                  {tool.args && Object.keys(tool.args).length > 0 && (
                                    <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
                                      <span className="font-medium text-gray-600">Input: </span>
                                      <span className="font-mono">
                                        {Object.entries(tool.args)
                                          .map(([key, value]) => `${key}: "${value}"`)
                                          .join(", ")}
                                      </span>
                                    </div>
                                  )}

                                  {/* Show tool result */}
                                  <div
                                    className={`p-2 rounded-md border-l-2 ${
                                      hasError ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                                    }`}
                                  >
                                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{displayContent}</div>
                                  </div>

                                  {/* Arrow to next step */}
                                  {index < message.toolInvocations.length - 1 && (
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white border rounded-full p-1">
                                      <ArrowRight className="h-3 w-3 text-blue-500" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 shadow-sm border p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask the AI assistant anything..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  Send
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Chain MCP Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-yellow-800">🔗 Tool Chaining</h4>
              <p className="text-sm text-yellow-700 mb-2">
                To chain tools together (where output of one becomes input of the next), be very explicit in your
                request:
              </p>
              <div className="bg-yellow-100 p-2 rounded text-xs font-mono text-yellow-800">
                "Please do this step by step: 1) First echo 'hello world', 2) Then reverse the result from step 1, 3)
                Then uppercase the result from step 2"
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✅ Good Chaining Examples</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Chain: echo 'test' → reverse the echoed result → uppercase the reversed result"</li>
                <li>• "Step 1: Generate a greeting. Step 2: Count words in that greeting. Step 3: Echo the count."</li>
                <li>
                  • "Process 'hello' by first echoing it, then pass that result to reverse, then pass that to uppercase"
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">❌ What Doesn't Work</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Echo, reverse, and uppercase 'hello world'" (all tools get same input)</li>
                <li>• "Use multiple tools on this text" (unclear chaining)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
