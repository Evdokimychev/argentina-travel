export type SiteFeedbackVariant = "success" | "error" | "info" | "loading";

export type SiteFeedbackAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type SiteFeedbackMessage = {
  title: string;
  description?: string;
  steps?: string[];
  action?: SiteFeedbackAction;
  duration?: number;
};

export type SiteToastItem = SiteFeedbackMessage & {
  id: string;
  variant: SiteFeedbackVariant;
  createdAt: number;
};
