import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { HumanLoopController } from "./server/humanLoop.js";

const humanLoop = new HumanLoopController();

const server = new Server(
  {
    name: "Human Loop MCP Server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "evaluate_need_for_human",
        description: "Evaluate if a task requires human intervention",
        inputSchema: {
          type: "object",
          properties: {
            taskDescription: {
              type: "string",
              description: "Description of the task to be evaluated"
            },
            context: {
              type: "object",
              description: "Additional context for evaluation"
            }
          },
          required: ["taskDescription"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "evaluate_need_for_human": {
      const taskDescription = String(request.params.arguments?.taskDescription);
      const context = request.params.arguments?.context || {};

      const evaluation = await humanLoop.processRequest({
        taskDescription,
        messages: [], // This would be populated with relevant conversation context
        modelCapabilities: context.modelCapabilities
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(evaluation, null, 2)
        }]
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "evaluate_task",
        description: "Evaluate if the current task needs human intervention"
      }
    ]
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "evaluate_task") {
    throw new Error("Unknown prompt");
  }

  return {
    messages: [
      {
        role: "system",
        content: {
          type: "text",
          text: "You are a self-evaluating AI system. Evaluate if the current task requires human intervention."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: "Please analyze the task and determine if human involvement is needed. Consider your capabilities, risks, and the need for human judgment."
        }
      }
    ]
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
