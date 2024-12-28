#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { TaskEvaluator } from "./evaluator.js";

const server = new Server(
  {
    name: "Human Loop MCP Server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
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
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "evaluate_need_for_human") {
    throw new Error("Unknown tool");
  }

  const taskDescription = String(request.params.arguments?.taskDescription);
  const modelCapabilities = Array.isArray(request.params.arguments?.modelCapabilities) 
    ? request.params.arguments?.modelCapabilities 
    : [];

  const evaluation = TaskEvaluator.evaluateTask(taskDescription, modelCapabilities);

  return {
    content: [{
      type: "text",
      text: JSON.stringify(evaluation, null, 2)
    }]
  };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [{
    name: "evaluate_task",
    description: "Evaluate if the current task needs human intervention",
    arguments: [{
      name: "taskDescription",
      description: "The task to evaluate",
      required: true
    }]
  }]
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "evaluate_task") {
    throw new Error("Unknown prompt");
  }

  const taskDescription = request.params.arguments?.taskDescription || "";

  return {
    messages: [
      {
        role: "system",
        content: {
          type: "text",
          text: `You are a self-evaluating AI system. Your task is to analyze whether the given task requires human intervention.

Given a task description, evaluate:
1. Task complexity and your capabilities
2. Risks and consequences of autonomous execution
3. Need for human emotional intelligence or judgment
4. Required permissions or authorizations
5. Ethical considerations

The evaluation will consider:
- Complexity levels
- Risk factors
- Model capabilities
- Task sensitivity
- Required expertise

The system will provide a detailed analysis including:
- Whether human intervention is needed
- Confidence level in the assessment
- Specific reasons for the recommendation
- Suggested actions
- Key statements about the evaluation
- Relevant questions for human reviewers if needed`
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: taskDescription
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