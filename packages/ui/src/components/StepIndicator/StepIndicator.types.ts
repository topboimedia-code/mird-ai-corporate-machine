export type StepStatus = "complete" | "current" | "upcoming";

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

export interface StepIndicatorProps {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
  "data-testid"?: string;
}
