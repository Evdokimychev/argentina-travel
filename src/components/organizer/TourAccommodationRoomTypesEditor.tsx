"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ORGANIZER_TOUR_ACCOMMODATION_ROOM_TYPES_MAX,
  ROOM_TYPE_NAME_PRESETS,
  createEmptyAccommodationRoomType,
  type OrganizerTourAccommodationRoomType,
} from "@/data/tour-accommodation-defaults";

interface TourAccommodationRoomTypesEditorProps {
  roomTypes: OrganizerTourAccommodationRoomType[];
  onChange: (roomTypes: OrganizerTourAccommodationRoomType[]) => void;
}

export default function TourAccommodationRoomTypesEditor({
  roomTypes,
  onChange,
}: TourAccommodationRoomTypesEditorProps) {
  function updateAt(index: number, room: OrganizerTourAccommodationRoomType) {
    onChange(roomTypes.map((item, itemIndex) => (itemIndex === index ? room : item)));
  }

  function addRoomType() {
    if (roomTypes.length >= ORGANIZER_TOUR_ACCOMMODATION_ROOM_TYPES_MAX) return;
    onChange([...roomTypes, createEmptyAccommodationRoomType()]);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200/80 bg-white p-4">
      <div>
        <h4 className="text-sm font-bold text-charcoal">Типы номеров</h4>
        <p className="mt-1 text-sm text-slate">
          Укажите варианты размещения и доплату за туриста. Нулевая доплата — включено в стоимость
          тура.
        </p>
      </div>

      {roomTypes.map((room, index) => (
        <div key={room.id} className="space-y-3 rounded-xl border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-charcoal">Тип {index + 1}</p>
            <button
              type="button"
              onClick={() => onChange(roomTypes.filter((item) => item.id !== room.id))}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal">Название</label>
              <Input
                list={`room-type-names-${room.id}`}
                value={room.name}
                onChange={(event) => updateAt(index, { ...room, name: event.target.value })}
                placeholder="Например, Двухместный номер"
              />
              <datalist id={`room-type-names-${room.id}`}>
                {ROOM_TYPE_NAME_PRESETS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-charcoal">
                Вместимость (чел.)
              </label>
              <Input
                type="number"
                min={1}
                value={room.capacity}
                onChange={(event) =>
                  updateAt(index, {
                    ...room,
                    capacity: Math.max(1, Number(event.target.value) || 1),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">Описание</label>
            <textarea
              value={room.description}
              rows={2}
              onChange={(event) => updateAt(index, { ...room, description: event.target.value })}
              placeholder="Кратко опишите номер"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal">
              Доплата за туриста, USD
            </label>
            <Input
              type="number"
              min={0}
              value={room.priceUsdPerPerson}
              onChange={(event) =>
                updateAt(index, {
                  ...room,
                  priceUsdPerPerson: Math.max(0, Number(event.target.value) || 0),
                })
              }
            />
          </div>
        </div>
      ))}

      {roomTypes.length < ORGANIZER_TOUR_ACCOMMODATION_ROOM_TYPES_MAX ? (
        <button
          type="button"
          onClick={addRoomType}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/15"
        >
          <Plus className="h-4 w-4" />
          Добавить тип номера
        </button>
      ) : null}
    </div>
  );
}
