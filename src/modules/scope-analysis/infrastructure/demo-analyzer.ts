import type { ScopeAnalyzer } from "@/modules/workspace/application/ports";
import type { Project, ScopeResult } from "@/modules/workspace/domain/entities";

export class DemoAnalyzer implements ScopeAnalyzer {
  async review(project: Project) {
    return {
      summary:
        "Demo checklist review of the recorded baseline. Confirm acceptance criteria, exclusions and revision limits with your client before work begins.",
      risks: [
        ...(!project.excludedScope ? ["No exclusions are recorded."] : []),
        ...(!project.contractText
          ? ["No contract text is available for comparison."]
          : []),
      ],
      clarificationQuestions: [
        "What acceptance criteria apply to each deliverable?",
        "Which changes count toward the revision limit?",
      ],
    };
  }
  readonly name = "Demo fixture (not AI)";
  async analyze(project: Project, request: string): Promise<ScopeResult> {
    const baseline = project.includedScope.toLowerCase();
    const features = [
      {
        pattern: /google\s*(login|oauth|authentication)|sign.?in with google/i,
        title: "Google authentication",
        terms: ["google login", "google oauth", "google authentication"],
      },
      {
        pattern: /pdf|export/i,
        title: "PDF report export",
        terms: ["pdf", "export"],
      },
    ].filter((feature) => feature.pattern.test(request));
    const newItems = features
      .filter((f) => !f.terms.some((t) => baseline.includes(t)))
      .map((f) => f.title);
    const matched = features
      .filter((f) => f.terms.some((t) => baseline.includes(t)))
      .map((f) => f.title);
    const known = features.length > 0;
    return {
      classification: !known
        ? "UNCERTAIN"
        : !newItems.length
          ? "WITHIN_SCOPE"
          : matched.length
            ? "PARTIALLY_OUT_OF_SCOPE"
            : "OUT_OF_SCOPE",
      confidence: known ? 0.8 : 0,
      summary: !known
        ? "This demo fixture recognizes Google authentication and PDF export only. Clarify the request or enable the live analyzer."
        : newItems.length
          ? "The listed features are absent from the included scope. Review the contract and effort estimate before proposing a change."
          : "The recognized request is already included in the supplied baseline. Review revision limits before proceeding.",
      matchedScopeItems: matched,
      newScopeItems: newItems,
      complexity: "MEDIUM",
      hoursMin: newItems.length * 4,
      hoursMax: newItems.length * 6,
      riskLevel: "LOW",
      recommendedAction: !known
        ? "CLARIFY_CLIENT"
        : newItems.length
          ? "CREATE_CHANGE_ORDER"
          : "NO_ACTION",
    };
  }
}
