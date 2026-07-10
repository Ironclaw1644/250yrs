/** Reasons a review can be reported (mirrors the DB check constraint). */
export const REPORT_REASONS = {
  spam: "Spam or advertising",
  offensive: "Offensive or inappropriate",
  conflict_of_interest: "Conflict of interest",
  not_a_customer: "Reviewer was never a customer",
  other: "Something else",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
