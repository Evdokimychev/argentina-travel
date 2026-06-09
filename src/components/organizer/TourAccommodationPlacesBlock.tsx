"use client";

import { Plus } from "lucide-react";
import {
  ORGANIZER_TOUR_ACCOMMODATIONS_MAX,
  createEmptyAccommodationPlace,
  type OrganizerTourAccommodationPlace,
} from "@/data/tour-accommodation-defaults";
import TourAccommodationPlaceEditor from "@/components/organizer/TourAccommodationPlaceEditor";

interface TourAccommodationPlacesBlockProps {
  places: OrganizerTourAccommodationPlace[];
  onChange: (places: OrganizerTourAccommodationPlace[]) => void;
}

export default function TourAccommodationPlacesBlock({
  places,
  onChange,
}: TourAccommodationPlacesBlockProps) {
  const canAdd = places.length < ORGANIZER_TOUR_ACCOMMODATIONS_MAX;

  function updateAt(index: number, place: OrganizerTourAccommodationPlace) {
    onChange(places.map((item, itemIndex) => (itemIndex === index ? place : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= places.length) return;
    const next = [...places];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addPlace() {
    if (!canAdd) return;
    onChange([...places, createEmptyAccommodationPlace()]);
  }

  function removeAt(index: number) {
    onChange(places.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
          Добавить место проживания
        </h2>
        <p className="mt-1 text-sm text-slate">
          Все варианты проживания будут отражены в блоке «Проживание» на странице тура на сайте
        </p>
      </div>

      {places.length ? (
        <div className="space-y-4">
          {places.map((place, index) => (
            <TourAccommodationPlaceEditor
              key={place.id}
              index={index}
              total={places.length}
              place={place}
              onChange={(next) => updateAt(index, next)}
              onRemove={() => removeAt(index)}
              onMoveUp={() => moveItem(index, -1)}
              onMoveDown={() => moveItem(index, 1)}
            />
          ))}
        </div>
      ) : null}

      {canAdd ? (
        <button
          type="button"
          onClick={addPlace}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить место
        </button>
      ) : (
        <p className="text-sm text-slate">
          Достигнут лимит — не больше {ORGANIZER_TOUR_ACCOMMODATIONS_MAX} мест проживания.
        </p>
      )}
    </section>
  );
}
