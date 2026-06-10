"use client";

import TourTermsListBlock from "@/components/organizer/TourTermsListBlock";
import { TOUR_PARTICIPANT_RECOMMENDATIONS_MAX } from "@/data/tour-organizer-display-defaults";

interface TourParticipantRecommendationsBlockProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export default function TourParticipantRecommendationsBlock({
  items,
  onChange,
}: TourParticipantRecommendationsBlockProps) {
  return (
    <TourTermsListBlock
      title="Рекомендации участникам"
      description="Советы туристам перед поездкой. Отображаются в карточке организатора на странице тура."
      items={items}
      onChange={onChange}
      placeholder="Например: Возьмите непродуваемую куртку"
      addLabel="Добавить рекомендацию"
      maxItems={TOUR_PARTICIPANT_RECOMMENDATIONS_MAX}
    />
  );
}
