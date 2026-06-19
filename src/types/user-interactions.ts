export type InteractionEntityType = "tour" | "excursion";

export type InteractionAction = "view" | "favorite";

export type UserInteractionRow = {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  entity_type: InteractionEntityType;
  entity_id: string;
  action: InteractionAction;
  ts: string;
};

export type InteractionBatchItem = {
  entityType: InteractionEntityType;
  entityId: string;
  action: InteractionAction;
  ts?: string;
};

export type SessionInteraction = InteractionBatchItem & {
  ts: string;
};
