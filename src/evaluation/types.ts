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
  messages: Array<{
    role: string;
    content: {
      type: string;
      text: string;
    };
  }>;
  taskDescription: string;
  modelCapabilities?: string[];
}
