// Controlled vocabulary: claims from different documents can only be compared if they land on the
// same topic key. The LLM picks from this list; it cannot invent new keys.
export const TOPICS: Record<string, string> = {
  "recruitment.pay_history": "Whether recruiters may ask candidates about current or previous salary",
  "recruitment.pay_range_timing": "When candidates must or can be told the pay range or starting pay",
  "contract.pay_confidentiality": "Whether employees can be bound to keep their own pay confidential",
  "pay.info_request_right": "What pay information employees can request (own pay, averages, colleagues) and response time",
  "pay.gap_reporting": "Gender pay gap reporting obligations, thresholds and deadlines",
  "pay.joint_assessment": "When a joint pay assessment with worker representatives is required",
  "payroll.variable_input_cutoff": "Deadline for submitting monthly variable payroll input",
  "internal.home_office_allowance": "Amount and conditions of the internal staff home-office allowance",
  "internal.telework_days": "How many days internal staff may work from home",
  "crossborder.social_security": "Which social security applies to cross-border workers, A1, 25% threshold",
  "crossborder.wage_tax": "How wage tax is handled for cross-border workers",
  "onboarding.dimona": "Timing of the Dimona IN declaration",
  "onboarding.steps": "Other onboarding steps for new employees",
  "other": "Anything else",
};

export const TOPIC_KEYS = Object.keys(TOPICS);

export function topicLabel(key: string): string {
  return TOPICS[key] ?? key;
}
