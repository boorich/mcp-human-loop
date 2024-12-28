interface EvaluationResult {
  needsHuman: boolean;
  confidence: number;
  reason: string;
  suggestedAction: {
    type: "review" | "input" | "approval" | "emotional_support";
    description: string;
  };
  confidentStatements: string[];
  humanQuestions: string[];
}

interface EvaluationFactors {
  complexity: number;    // 0-1 score for task complexity
  risk: number;         // 0-1 score for risk level
  capability: number;   // 0-1 score for model capability match
  sensitivity: number;  // 0-1 score for task sensitivity
}

class TaskEvaluator {
  private static readonly COMPLEXITY_INDICATORS = {
    high: ["complex", "sophisticated", "advanced", "intricate", "complicated", "technical"],
    medium: ["moderate", "regular", "standard", "normal"],
    low: ["simple", "basic", "straightforward", "easy"]
  };

  private static readonly RISK_INDICATORS = {
    high: ["critical", "emergency", "urgent", "life", "death", "medical", "health", "legal", "suicide", "harm"],
    medium: ["important", "sensitive", "private", "confidential", "personal"],
    low: ["routine", "regular", "standard", "practice"]
  };

  private static readonly SENSITIVITY_INDICATORS = {
    high: ["private", "confidential", "personal", "secret", "sensitive"],
    medium: ["internal", "business", "professional"],
    low: ["public", "open", "general"]
  };

  static evaluateTask(taskDescription: string, modelCapabilities: string[] = []): EvaluationResult {
    const factors = this.calculateFactors(taskDescription, modelCapabilities);
    const needsHuman = this.determineHumanNeed(factors);
    const confidence = this.calculateConfidence(factors);
    
    return {
      needsHuman,
      confidence,
      reason: this.generateReason(factors, needsHuman),
      suggestedAction: this.determineSuggestedAction(factors, needsHuman),
      confidentStatements: this.generateConfidentStatements(taskDescription, factors, needsHuman),
      humanQuestions: this.generateHumanQuestions(factors, needsHuman)
    };
  }

  private static calculateFactors(taskDescription: string, modelCapabilities: string[]): EvaluationFactors {
    const text = taskDescription.toLowerCase();
    
    // Calculate complexity score
    const complexityScore = this.calculateIndicatorScore(text, this.COMPLEXITY_INDICATORS);
    
    // Calculate risk score
    const riskScore = this.calculateIndicatorScore(text, this.RISK_INDICATORS);
    
    // Calculate sensitivity score
    const sensitivityScore = this.calculateIndicatorScore(text, this.SENSITIVITY_INDICATORS);
    
    // Calculate capability match score
    const capabilityScore = this.calculateCapabilityScore(text, modelCapabilities);

    return {
      complexity: complexityScore,
      risk: riskScore,
      capability: capabilityScore,
      sensitivity: sensitivityScore
    };
  }

  private static calculateIndicatorScore(text: string, indicators: Record<string, string[]>): number {
    let score = 0;
    let matches = 0;

    // Check high-level indicators (weight: 1.0)
    indicators.high.forEach(indicator => {
      if (text.includes(indicator)) {
        score += 1.0;
        matches++;
      }
    });

    // Check medium-level indicators (weight: 0.5)
    indicators.medium.forEach(indicator => {
      if (text.includes(indicator)) {
        score += 0.5;
        matches++;
      }
    });

    // Check low-level indicators (weight: 0.2)
    indicators.low.forEach(indicator => {
      if (text.includes(indicator)) {
        score += 0.2;
        matches++;
      }
    });

    return matches > 0 ? score / matches : 0.5; // Default to medium if no matches
  }

  private static calculateCapabilityScore(text: string, capabilities: string[]): number {
    if (!capabilities.length) return 0.5; // Default to medium if no capabilities provided
    
    const relevantCapabilities = capabilities.filter(cap => 
      text.includes(cap.toLowerCase())
    );

    return relevantCapabilities.length / capabilities.length;
  }

  private static determineHumanNeed(factors: EvaluationFactors): boolean {
    const riskThreshold = 0.7;
    const sensitivityThreshold = 0.8;
    const complexityThreshold = 0.8;
    const capabilityThreshold = 0.3;

    return factors.risk >= riskThreshold ||
           factors.sensitivity >= sensitivityThreshold ||
           factors.complexity >= complexityThreshold ||
           factors.capability <= capabilityThreshold;
  }

  private static calculateConfidence(factors: EvaluationFactors): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;

    // Adjust based on capability match
    confidence += (factors.capability - 0.5) * 0.3;

    // Reduce confidence for high complexity tasks
    confidence -= factors.complexity * 0.1;

    // Increase confidence for clear risk assessments
    confidence += (factors.risk > 0.8 || factors.risk < 0.2) ? 0.1 : 0;

    // Ensure confidence stays within bounds
    return Math.max(0.1, Math.min(0.9, confidence));
  }

  private static generateReason(factors: EvaluationFactors, needsHuman: boolean): string {
    const reasons: string[] = [];

    if (factors.risk > 0.7) {
      reasons.push("high risk level");
    }
    if (factors.complexity > 0.7) {
      reasons.push("significant complexity");
    }
    if (factors.sensitivity > 0.7) {
      reasons.push("sensitive nature");
    }
    if (factors.capability < 0.3) {
      reasons.push("limited model capabilities");
    }

    if (reasons.length === 0) {
      return needsHuman 
        ? "Multiple factors indicate human oversight would be beneficial"
        : "Task appears within AI capabilities with acceptable risk levels";
    }

    return `Task requires human involvement due to ${reasons.join(", ")}`;
  }

  private static determineSuggestedAction(factors: EvaluationFactors, needsHuman: boolean): 
    { type: "review" | "input" | "approval" | "emotional_support", description: string } {
    if (!needsHuman) {
      return {
        type: "review",
        description: "AI can proceed with optional human review"
      };
    }

    if (factors.risk > 0.7) {
      return {
        type: "approval",
        description: "Requires explicit human approval before proceeding"
      };
    }

    if (factors.sensitivity > 0.7) {
      return {
        type: "input",
        description: "Needs human input on sensitive aspects"
      };
    }

    if (factors.complexity > 0.7) {
      return {
        type: "review",
        description: "Requires human review due to task complexity"
      };
    }

    return {
      type: "emotional_support",
      description: "Human guidance recommended for best results"
    };
  }

  private static generateConfidentStatements(
    taskDescription: string, 
    factors: EvaluationFactors, 
    needsHuman: boolean
  ): string[] {
    return [
      `Task evaluated: ${taskDescription}`,
      `Risk level: ${this.formatFactor(factors.risk)}`,
      `Complexity level: ${this.formatFactor(factors.complexity)}`,
      `Capability match: ${this.formatFactor(factors.capability)}`,
      `Sensitivity level: ${this.formatFactor(factors.sensitivity)}`,
      `Human intervention ${needsHuman ? 'required' : 'not required'}`
    ];
  }

  private static generateHumanQuestions(factors: EvaluationFactors, needsHuman: boolean): string[] {
    if (!needsHuman) return [];

    const questions: string[] = [];

    if (factors.risk > 0.6) {
      questions.push("What is the urgency level of this task?");
      questions.push("Are there any immediate risks to address?");
    }

    if (factors.complexity > 0.6) {
      questions.push("What specific aspects need human expertise?");
    }

    if (factors.sensitivity > 0.6) {
      questions.push("Are there any privacy or confidentiality concerns?");
    }

    return questions;
  }

  private static formatFactor(factor: number): string {
    if (factor >= 0.7) return "High";
    if (factor >= 0.4) return "Medium";
    return "Low";
  }
}

export { TaskEvaluator, EvaluationResult, EvaluationFactors };