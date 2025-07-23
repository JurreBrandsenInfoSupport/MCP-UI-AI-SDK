import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, Play, Wrench } from "lucide-react"

export function MCPServerInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Echo MCP Server
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Play className="h-4 w-4" />
            How to Run
          </h4>
          <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
            <p>node scripts/echo-mcp-server.js</p>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This starts a basic MCP server that provides simple text manipulation tools.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Available Tools
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">echo</Badge>
              <span className="text-sm">Echo back the input text</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">reverse</Badge>
              <span className="text-sm">Reverse the input text</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">uppercase</Badge>
              <span className="text-sm">Convert text to uppercase</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">count_words</Badge>
              <span className="text-sm">Count words in text</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">generate_greeting</Badge>
              <span className="text-sm">Generate personalized greetings</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Configuration for UI</h4>
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p>
              <strong>Transport Type:</strong> Standard I/O
            </p>
            <p>
              <strong>Command:</strong> node
            </p>
            <p>
              <strong>Arguments:</strong> scripts/echo-mcp-server.js
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Example Prompts</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• "Can you echo the text 'Hello World'?"</li>
            <li>• "Reverse the text 'OpenAI'"</li>
            <li>• "Convert 'hello world' to uppercase"</li>
            <li>• "Count the words in 'The quick brown fox jumps'"</li>
            <li>• "Generate a formal greeting for John"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
