import { EvaluationContext, EvaluationResult } from "./types.js";

export class LLMEvaluator {
  private createEvaluationPrompt(context: EvaluationContext) {
    return [
      {
        role: "system",
        content: {
          type: "text",
          text: `You are a self-evaluating AI system. You need to determine if the current task requires human intervention.
                Consider:
                1. Task complexity and your capabilities
                2. Risk and consequences of actions
                3. Need for human emotional intelligence
                4. Required permissions or authorizations
                
                Be conservative - if in doubt, recommend human involvement.`
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `Task Description: ${context.taskDescription}
                
                Evaluate if you can handle this task autonomously or if human intervention is needed.
                Consider your current capabilities and limitations.`
        }
      }
    ];
  }

  private parseEvaluationResponse(response: string): EvaluationResult {
    const needsHuman = response.toLowerCase().includes("need human") ||
                      response.toLowerCase().includes("human required");

    return {
      needsHuman,
      confidence: needsHuman ? 0.8 : 0.9,
      reason: response,
      suggestedAction: needsHuman ? {
        type: this.determineActionType(response),
        description: response
      } : undefined
    };
  }

  private determineActionType(response: string): 'review' | 'input' | 'approval' | 'emotional_support' {
    const r = response.toLowerCase();
    if (r.includes("emotion") || r.includes("support")) return 'emotional_support';
    if (r.includes("approve") || r.includes("authorize")) return 'approval';
    if (r.includes("input") || r.includes("provide")) return 'input';
    return 'review';
  }

  async evaluate(context: EvaluationContext): Promise<EvaluationResult> {
    const evaluationPrompt = this.createEvaluationPrompt(context);
    const mockLLMResponse = "Need human review for this task due to potential risks...";
    return this.parseEvaluationResponse(mockLLMResponse);
  }
}
