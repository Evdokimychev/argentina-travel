import { describe, expect, it } from "vitest";
import {
  apartmentActionConfirmation,
  createEditableImage,
  minorToMoneyText,
  moneyTextToMinor,
} from "@/components/apartments/ApartmentManagerView";
import type { ApartmentPrivate } from "@/types/apartments";

describe("ApartmentManagerView owner-safe helpers", () => {
  it("converts ordinary money input to minor units without floating-point drift", () => {
    expect(moneyTextToMinor("125.00")).toBe(12_500);
    expect(moneyTextToMinor("1 250,7")).toBe(125_070);
    expect(moneyTextToMinor("0.29")).toBe(29);
    expect(moneyTextToMinor("1.999")).toBeNull();
    expect(moneyTextToMinor("1e3")).toBeNull();
    expect(minorToMoneyText(12_501)).toBe("125.01");
  });

  it("keeps a stable unique client key while an image is edited", () => {
    const source = {
      mediaRef: "/media/apartments/home.jpg",
      altText: "Гостиная",
      rightsHolder: "Владелец",
      licenseCode: "owned",
      position: 0,
    };
    const first = createEditableImage(source);
    const second = createEditableImage(source);
    const edited = { ...first, altText: "Светлая гостиная" };

    expect(first.clientKey).not.toBe(second.clientKey);
    expect(edited.clientKey).toBe(first.clientKey);
    expect(source.altText).toBe("Гостиная");
  });

  it("requires confirmation for every destructive moderation action", () => {
    const review = { title: "Квартира в Палермо", status: "review" } as ApartmentPrivate;
    const published = { title: "Квартира в Палермо", status: "published" } as ApartmentPrivate;

    expect(apartmentActionConfirmation(review, "publish")).toContain("Опубликовать");
    expect(apartmentActionConfirmation(review, "return_to_draft")).toContain("Вернуть");
    expect(apartmentActionConfirmation(published, "archive")).toContain("исчезнет с публичных страниц");
  });
});
