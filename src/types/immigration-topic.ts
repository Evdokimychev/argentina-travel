import type { GuidePillarContent } from "@/types/guide-pillar";

/** Hub page topic card + dedicated article page metadata. */
export type ImmigrationTopicPage = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  heroImage?: string;
  pillarPage: GuidePillarContent;
};
