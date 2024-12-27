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
            modelCapabilities: {
              type: "array",
              items: { type: "string" },
              description: "List of model capabilities"
            }
          },
          required: ["taskDescription"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "evaluate_need_for_human": {
      const taskDescription = String(request.params.arguments?.taskDescription);
      const modelCapabilities = request.params.arguments?.modelCapabilities || [];

      const evaluation = await humanLoop.processRequest({
        taskDescription,
        messages: [],
        modelCapabilities
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
