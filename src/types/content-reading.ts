export type ContentTocItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

export type RelatedContentKind =
  | "guide"
  | "blog"
  | "destination"
  | "place"
  | "collection"
  | "itinerary"
  | "tour"
  | "link";

export type RelatedContentItem = {
  title: string;
  href: string;
  description?: string;
  kind?: RelatedContentKind;
};

export type ContentHeadingSource = {
  heading: string;
  level?: 2 | 3;
  subheadings?: string[];
};
