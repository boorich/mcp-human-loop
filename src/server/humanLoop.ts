import { LLMEvaluator } from "../evaluation/evaluator.js";
import { EvaluationContext } from "../evaluation/types.js";

export class HumanLoopController {
  private evaluator: LLMEvaluator;

  constructor() {
    this.evaluator = new LLMEvaluator();
  }

  async processRequest(context: EvaluationContext) {
    try {
      // Let the LLM evaluate if it needs human help
      const evaluation = await this.evaluator.evaluate(context);

      if (evaluation.needsHuman) {
        return {
          status: 'human_required',
          reason: evaluation.reason,
          action: evaluation.suggestedAction,
          confidence: evaluation.confidence
        };
      }

      return {
        status: 'autonomous',
        confidence: evaluation.confidence
      };
    } catch (error) {
      // If evaluation fails, default to requiring human intervention
      return {
        status: 'human_required',
        reason: 'Evaluation failed, defaulting to human intervention',
        confidence: 1.0
      };
    }
  }
}
