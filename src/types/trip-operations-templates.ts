import type { TripTaskCategory, TripTaskStatus } from "@/types/trip-operations";

export type OmitTripTaskFields = {
  title: string;
  category: TripTaskCategory;
  status: TripTaskStatus;
  clientVisible: boolean;
  description?: string;
  dueDate?: string;
};

export interface TripTaskTemplate {
  id: string;
  label: string;
  tourSlugs: string[];
  tasks: OmitTripTaskFields[];
}
