import { Message } from "@modelcontextprotocol/sdk/types.js";

export interface EvaluationResult {
  needsHuman: boolean;
  reason?: string;
  confidence: number;
  suggestedAction?: {
    type: 'review' | 'input' | 'approval' | 'emotional_support';
    description: string;
  };
}

export interface EvaluationContext {
  messages: Message[];
  taskDescription: string;
  modelCapabilities?: string[];
}
