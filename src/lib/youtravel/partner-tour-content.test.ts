import { describe, expect, it } from "vitest";
import {
  buildYouTravelPartnerContent,
  mergeYouTravelDescriptionWithPublicHighlights,
  resolveYouTravelChildrenSummary,
  resolveYouTravelChildFriendly,
  resolveYouTravelDayPhotos,
  resolveYouTravelIntroHtml,
  splitYouTravelHighlightTail,
} from "@/lib/youtravel/partner-tour-content";
import {
  formatYouTravelArrivalDisplayDate,
  normalizeYouTravelArrivalCityLabel,
  parseYouTravelArrivalDateTime,
  resolveYouTravelCityLabel,
  resolveYouTravelCountry,
} from "@/lib/youtravel/partner-tour-locations";
import { mapYouTravelAccommodations } from "@/lib/youtravel/partner-tour-accommodation";
import {
  extractPublicActivityComment,
  extractPublicActivityDescription,
  extractPublicActivityLabel,
  extractPublicArrivalInfo,
  extractPublicComfortDescription,
  extractPublicDescriptionHtml,
  extractPublicImportantToKnow,
  extractPublicSchemaDescription,
} from "@/lib/youtravel/public-description";

const SAMPLE_PUBLIC_DESCRIPTION_HTML = `
<div class="tour-detail-description__text ytme-text-m-regular">
  <p>Изящный, живущий в&nbsp;ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к&nbsp;вершинам Патагонии, вертолетная прогулка над стеной из&nbsp;водопадов и&nbsp;панорамный коттедж в&nbsp;Чили. 3 страны за&nbsp;13 дней в&nbsp;путешествии мечты!</p>
  <ul><li>Торрес-Дель-Пайне</li><li>Барилоче на электробайке</li><li>Фицрой</li></ul>
</div>
`;

const SAMPLE_EVENT_DESCRIPTION_JSON = `
"events":[{"@type":"Event","name":"Патагония","description":"Изящный, живущий в ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к вершинам Патагонии, вертолетная прогулка над стеной из водопадов и панорамный коттедж в Чили. 3 страны за 13 дней в путешествии мечты!Торрес-Дель-ПайнеБарилоче на электробайкеФицрой"}]
`;

const SAMPLE_ACTIVITY_HTML = `
<div class="tour-activity__title-value flex items-center pb-6">
  <span>Интенсивная</span>
</div>
<div class="tour-activity__description ytme-text-xs-regular-grey">
  Постоянные перемещения, периодические долгосрочные пешие вылазки на природу.
</div>
<div class="tour-activity__comment-text ytme-text-s-regular">
  Это путешествие идеально подойдет для людей, любящих долгие прогулки.
</div>
`;

describe("mergeYouTravelDescriptionWithPublicHighlights", () => {
  it("appends highlight list from public JSON-LD description", () => {
    const intro =
      "<p>Изящный, живущий в&nbsp;ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к&nbsp;вершинам Патагонии, вертолетная прогулка над стеной из&nbsp;водопадов и&nbsp;панорамный коттедж в&nbsp;Чили. 3 страны за&nbsp;13 дней в&nbsp;путешествии мечты!</p>";
    const publicDescription =
      "Изящный, живущий в ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к вершинам Патагонии, вертолетная прогулка над стеной из водопадов и панорамный коттедж в Чили. 3 страны за 13 дней в путешествии мечты!Торрес-Дель-ПайнеБарилоче на электробайкеФицрой";

    const merged = mergeYouTravelDescriptionWithPublicHighlights(intro, publicDescription);
    expect(merged).toContain("<ul>");
    expect(merged).toContain("Торрес-Дель-Пайне");
    expect(merged).toContain("Барилоче на электробайке");
  });

  it("splits concatenated highlight tail", () => {
    expect(splitYouTravelHighlightTail("Торрес-Дель-ПайнеБарилоче на электробайкеФицрой")).toEqual([
      "Торрес-Дель-Пайне",
      "Барилоче на электробайке",
      "Фицрой",
    ]);
  });

  it("builds highlight list from public plain when API description is missing", () => {
    const publicDescription =
      "Изящный, живущий в ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к вершинам Патагонии, вертолетная прогулка над стеной из водопадов и панорамный коттедж в Чили. 3 страны за 13 дней в путешествии мечты!Торрес-Дель-ПайнеБарилоче на электробайкеФицрой";

    const merged = mergeYouTravelDescriptionWithPublicHighlights(undefined, publicDescription);
    expect(merged).toContain("<ul>");
    expect(merged).toContain("Торрес-Дель-Пайне");
  });
});

describe("resolveYouTravelIntroHtml", () => {
  it("prefers public page description HTML with paragraphs and highlights", () => {
    const intro = resolveYouTravelIntroHtml({
      description:
        "<p>Изящный, живущий в&nbsp;ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к&nbsp;вершинам Патагонии, вертолетная прогулка над стеной из&nbsp;водопадов и&nbsp;панорамный коттедж в&nbsp;Чили. 3 страны за&nbsp;13 дней в&nbsp;путешествии мечты!</p>",
      public_page_extras: {
        descriptionHtml:
          "<p>Изящный, живущий в&nbsp;ритме танго Буэнос-Айрес.</p><ul><li>Торрес-Дель-Пайне</li></ul>",
      },
    });

    expect(intro).toContain("<ul>");
    expect(intro).toContain("Торрес-Дель-Пайне");
  });

  it("merges API description with schemaDescription from public page extras", () => {
    const intro = resolveYouTravelIntroHtml({
      description:
        "<p>Изящный, живущий в&nbsp;ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к&nbsp;вершинам Патагонии, вертолетная прогулка над стеной из&nbsp;водопадов и&nbsp;панорамный коттедж в&nbsp;Чили. 3 страны за&nbsp;13 дней в&nbsp;путешествии мечты!</p>",
      public_page_extras: {
        schemaDescription:
          "Изящный, живущий в ритме танго Буэнос-Айрес, круиз вблизи 1000-летнего ледника, треккинги к вершинам Патагонии, вертолетная прогулка над стеной из водопадов и панорамный коттедж в Чили. 3 страны за 13 дней в путешествии мечты!Торрес-Дель-ПайнеБарилоче на электробайке",
      },
    });

    expect(intro).toContain("Барилоче на электробайке");
  });
});

describe("public description extraction", () => {
  it("extracts full description HTML from the public tour page", () => {
    const html = extractPublicDescriptionHtml(SAMPLE_PUBLIC_DESCRIPTION_HTML);
    expect(html).toContain("<p>");
    expect(html).toContain("<ul>");
    expect(html).toContain("Торрес-Дель-Пайне");
  });

  it("extracts schema description from embedded Event JSON", () => {
    const schema = extractPublicSchemaDescription(SAMPLE_EVENT_DESCRIPTION_JSON);
    expect(schema).toContain("мечты!");
    expect(schema).toContain("Торрес-Дель-Пайне");
  });
});

describe("resolveYouTravelDayPhotos", () => {
  it("resolves day.photo objects from YouTravel API", () => {
    const photos = resolveYouTravelDayPhotos({
      title: "День 1",
      photo: [
        {
          src: "https://cf.youtravel.me/public/images/tour/media/2024/08/16/sample.JPG",
          host: "cf.youtravel.me",
        },
        {
          src: "https://cf.youtravel.me/public/images/tour/media/2024/08/16/sample.JPG",
          host: "cf.youtravel.me",
        },
      ],
    });

    expect(photos).toHaveLength(1);
    expect(photos[0]).toContain("cf.youtravel.me");
  });
});

describe("buildYouTravelPartnerContent activity and comfort", () => {
  const basePayload = {
    activity_data: { level: 4, title: "Активность" },
    comfort_data: { level: 5, title: "Комфорт" },
    type_allocation: "Отели 4*, Апартаменты, Коттеджи",
    type_accommodation: [{ id: "2464", name: "2-x местный номер" }],
    photo_allocation: [{ src: "images/tour/allocation/sample.jpg", host: "cf.youtravel.me" }],
    age_from: 18,
    age_to: 45,
    demands: "",
    public_page_extras: {
      activityDescription:
        "Постоянные перемещения, периодические долгосрочные пешие вылазки на природу.",
      activityComment: "Это путешествие идеально подойдет для людей, любящих долгие прогулки.",
      comfortDescription:
        "Проживание в отелях 4* и 5*, в глэмпингах, отелях-бутиках с экстра-обслуживанием.",
    },
  };

  it("maps comfort level 4 to YouTravel storefront label Высокий", () => {
    const content = buildYouTravelPartnerContent({
      comfort_data: { level: 4, title: "Комфорт" },
    });

    expect(content.comfortLevel).toBe(4);
    expect(content.comfortLabel).toBe("Высокий");
  });

  it("maps activity and comfort levels from payload", () => {
    const content = buildYouTravelPartnerContent(basePayload);

    expect(content.activityLevel).toBe(4);
    expect(content.activityLabel).toBe("Интенсивная");
    expect(content.activityDescription).toContain("Постоянные перемещения");
    expect(content.activityExpertComment).toContain("идеально подойдет");
    expect(content.comfortLevel).toBe(5);
    expect(content.comfortLabel).toBe("Уникальный");
    expect(content.comfortDescription).toContain("глэмпингах");
    expect(content.comfortHtml).toContain("глэмпингах");
    expect(content.accommodationTypesSummary).toBe("Отели 4*, Апартаменты, Коттеджи");
    expect(content.accommodationPhotos?.[0]).toContain("cf.youtravel.me");
  });

  it("derives child policy from age limits", () => {
    expect(resolveYouTravelChildFriendly(basePayload)).toBe(false);
    expect(resolveYouTravelChildrenSummary(basePayload)).toBe("Только взрослые");
  });

  it("uses public activity comment instead of demands field", () => {
    const content = buildYouTravelPartnerContent({
      ...basePayload,
      demands: "Нужна медицинская страховка",
    });

    expect(content.activityExpertComment).toContain("идеально подойдет");
    expect(content.additionalInfoHtml).toContain("Нужна медицинская страховка");
  });

  it("merges fragmented included list items split across lines", () => {
    const content = buildYouTravelPartnerContent({
      included: [
        "Проживание",
        "в",
        "комфортных отелях 3-4",
        "Питание: все завтраки в отелях",
      ],
    });

    expect(content.includedHtml).toContain("<li>Проживание в комфортных отелях 3-4</li>");
    expect(content.includedHtml).toContain("<li>Питание: все завтраки в отелях</li>");
    expect(content.includedHtml?.match(/<li>/g)?.length).toBe(2);
  });

  it("merges fragmented included items from HTML lists", () => {
    const content = buildYouTravelPartnerContent({
      included:
        "<ul><li>Проживание</li><li>в</li><li>комфортных отелях 3-4</li><li>Питание: все завтраки</li></ul>",
    });

    expect(content.includedHtml).toContain("<li>Проживание в комфортных отелях 3-4</li>");
    expect(content.includedHtml).toContain("<li>Питание: все завтраки</li>");
    expect(content.includedHtml?.match(/<li>/g)?.length).toBe(2);
  });

  it("maps important-to-know and arrival info from public page extras", () => {
    const content = buildYouTravelPartnerContent({
      ...basePayload,
      public_page_extras: {
        importantToKnowItems: [
          { title: "Условия отмены", html: "<p>Отмена за 45 дней.</p>" },
          { title: "Как забронировать", html: "<p>Нажмите «Забронировать».</p>" },
        ],
        arrivalInfo: {
          start: { label: "Старт", date: "14 ноября", city: "Буэнос-Айрес" },
          finish: { label: "Финиш", date: "28 ноября", city: "Буэнос-Айрес" },
        },
      },
    });

    expect(content.importantToKnowItems?.length).toBeGreaterThanOrEqual(2);
    expect(content.importantToKnowItems?.[0]?.title).toBe("Условия отмены");
    expect(content.arrivalInfo?.startCity).toBe("Буэнос-Айрес");
    expect(content.arrivalInfo?.finishDate).toBe("28 ноября");
  });

  it("sets finishPoint from finish_point_city API field", () => {
    const content = buildYouTravelPartnerContent({
      start_point_city: { name: "El Calafate", nameRu: "Эль-Калафате" },
      finish_point_city: { name: "Buenos Aires", nameRu: "Буэнос-Айрес" },
      country: { nameRu: "Аргентина" },
    });

    expect(content.meetingPoint).toBe("Эль-Калафате, Аргентина");
    expect(content.finishPoint).toBe("Буэнос-Айрес, Аргентина");
    expect(content.arrivalInfo?.startCity).toBe("Эль-Калафате, Аргентина");
    expect(content.arrivalInfo?.finishCity).toBe("Буэнос-Айрес, Аргентина");
  });

  it("builds arrivalInfo from API cities when public scrape is missing", () => {
    const content = buildYouTravelPartnerContent({
      start_point_city: "Эль-Калафате",
      finish_point_city: "Буэнос-Айрес",
      country: "Аргентина",
    });

    expect(content.arrivalInfo?.startCity).toBe("Эль-Калафате, Аргентина");
    expect(content.arrivalInfo?.finishCity).toBe("Буэнос-Айрес, Аргентина");
    expect(content.arrivalInfo?.startLabel).toBe("Старт");
    expect(content.arrivalInfo?.finishLabel).toBe("Финиш");
  });

  it("parses scraped arrival date and time parts", () => {
    const content = buildYouTravelPartnerContent({
      start_point_city: "Эль-Калафате",
      finish_point_city: "Буэнос-Айрес",
      public_page_extras: {
        arrivalInfo: {
          start: {
            label: "Старт",
            date: "22 февраля, 16:00 (местное время)",
            city: "Эль-Калафате, Аргентина",
          },
          finish: {
            label: "Финиш",
            date: "6 марта, 12:00 (местное время)",
            city: "Буэнос-Айрес, Аргентина",
          },
        },
      },
    });

    expect(content.arrivalInfo?.startDate).toBe("22 февраля");
    expect(content.arrivalInfo?.startTime).toBe("16:00");
    expect(content.arrivalInfo?.finishDate).toBe("6 марта");
    expect(content.arrivalInfo?.finishTime).toBe("12:00");
  });
});

describe("YouTravel location helpers", () => {
  it("resolves city label with country suffix", () => {
    expect(resolveYouTravelCityLabel("Эль-Калафате", "Аргентина")).toBe(
      "Эль-Калафате, Аргентина",
    );
    expect(resolveYouTravelCityLabel({ nameRu: "Буэнос-Айрес" }, "Аргентина")).toBe(
      "Буэнос-Айрес, Аргентина",
    );
    expect(resolveYouTravelCityLabel("Эль-Калафате", "Аргентина, Чили")).toBe(
      "Эль-Калафате, Аргентина",
    );
  });

  it("deduplicates repeated countries in arrival city labels", () => {
    expect(
      normalizeYouTravelArrivalCityLabel("Эль-Калафате, Аргентина, Аргентина, Чили"),
    ).toBe("Эль-Калафате, Аргентина");
    expect(normalizeYouTravelArrivalCityLabel("Ушуая, Аргентина, Аргентина, Чили")).toBe(
      "Ушуая, Аргентина",
    );
  });

  it("resolves country from payload fields", () => {
    expect(resolveYouTravelCountry({ country: "Аргентина" })).toBe("Аргентина");
    expect(resolveYouTravelCountry({ country: { nameRu: "Чили" } })).toBe("Чили");
    expect(resolveYouTravelCountry({ countries: ["Аргентина"] })).toBe("Аргентина");
  });

  it("parses and formats arrival date/time strings", () => {
    expect(parseYouTravelArrivalDateTime("22 февраля, 16:00 (местное время)")).toEqual({
      datePart: "22 февраля",
      timePart: "16:00",
    });
    expect(formatYouTravelArrivalDisplayDate("2026-02-22", "16:00")).toBe(
      "22 февраля, 16:00 (местное время)",
    );
    expect(formatYouTravelArrivalDisplayDate("2026-02-22")).toBe("22 февраля");
  });
});

const SAMPLE_IMPORTANT_HTML = `
<div class="tour-important-to-know">
  <div class="tour-important-to-know__list ytme-text-m-regular">
    <div class="tour-important-to-know__list-item w-full rounded-10 mt-20 p-24">
      <div class="tour-important-to-know__list-item-title flex items-center justify-between">
        <span class="ytme-text-m-semibold cl-primary-black">Подготовка к туру</span>
      </div>
      <div class="tour-important-to-know__list-item-body mt-12"><p>Нужна медицинская страховка.</p></div>
    </div>
    <div class="tour-important-to-know__list-item w-full rounded-10 mt-20 p-24">
      <div class="tour-important-to-know__list-item-title flex items-center justify-between">
        <span class="ytme-text-m-semibold cl-primary-black">Визы</span>
      </div>
      <div class="tour-important-to-know__list-item-body mt-12"><p>Для граждан РФ виза не нужна.</p></div>
    </div>
  </div>
</div>
<div class="tour-main-section"><div class="tour-main-section__header"></div></div>
`;

const SAMPLE_ARRIVAL_HTML = `
<div class="tour-arrival-info flex flex-wrap">
  <div class="tour-arrival-info__item">
    <div class="tour-arrival-info__title flex items-center">
      <div class="flex-grow">Старт</div>
    </div>
    <div class="ytme-text-m-semibold">14&nbsp;ноября</div>
    <div class="ytme-text-xs-semibold cl-dark-grey-primary">Буэнос-Айрес</div>
  </div>
  <div class="tour-arrival-info__item">
    <div class="tour-arrival-info__title flex items-center">
      <div class="flex-grow">Финиш</div>
    </div>
    <div class="ytme-text-m-semibold">28&nbsp;ноября</div>
    <div class="ytme-text-xs-semibold cl-dark-grey-primary">Буэнос-Айрес</div>
  </div>
</div>
</div>
`;

describe("public HTML extraction", () => {
  it("extracts activity description and expert comment", () => {
    expect(extractPublicActivityLabel(SAMPLE_ACTIVITY_HTML)).toBe("Интенсивная");
    expect(extractPublicActivityDescription(SAMPLE_ACTIVITY_HTML)).toContain("Постоянные перемещения");
    expect(extractPublicActivityComment(SAMPLE_ACTIVITY_HTML)).toContain("идеально подойдет");
  });

  it("extracts comfort description from allocation block", () => {
    const html =
      '<div class="tour-allocation-details__body-description cl-dark-grey-primary">Проживание в отелях 4* и 5*</div>';
    expect(extractPublicComfortDescription(html)).toContain("Проживание в отелях");
  });

  it("extracts important-to-know accordion items", () => {
    const items = extractPublicImportantToKnow(SAMPLE_IMPORTANT_HTML);
    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe("Подготовка к туру");
    expect(items[0]?.html).toContain("медицинская страховка");
    expect(items[1]?.title).toBe("Визы");
  });

  it("extracts arrival info start/finish grid", () => {
    const arrival = extractPublicArrivalInfo(SAMPLE_ARRIVAL_HTML);
    expect(arrival?.start.label).toBe("Старт");
    expect(arrival?.start.date).toBe("14 ноября");
    expect(arrival?.start.city).toBe("Буэнос-Айрес");
    expect(arrival?.finish.label).toBe("Финиш");
    expect(arrival?.finish.date).toBe("28 ноября");
  });
});

describe("mapYouTravelAccommodations", () => {
  it("builds accommodation card with photos and room types", () => {
    const content = buildYouTravelPartnerContent({
      comfort_data: { level: 5 },
      type_allocation: "Отели 4*, Апартаменты",
      type_accommodation: [{ id: "2464", name: "2-x местный номер" }],
      photo_allocation: [{ src: "images/tour/allocation/sample.jpg", host: "cf.youtravel.me" }],
      public_page_extras: {
        comfortDescription: "Проживание в отелях 4* и 5*.",
      },
    });
    const payload = {
      type_allocation: "Отели 4*, Апартаменты",
      type_accommodation: [{ id: "2464", name: "2-x местный номер" }],
      photo_allocation: [{ src: "images/tour/allocation/sample.jpg", host: "cf.youtravel.me" }],
    };

    const accommodations = mapYouTravelAccommodations(content, payload);

    expect(accommodations).toHaveLength(1);
    expect(accommodations[0]?.name).toBe("Отели 4*, Апартаменты");
    expect(accommodations[0]?.images[0]).toContain("cf.youtravel.me");
    expect(accommodations[0]?.roomTypes?.[0]?.name).toBe("2-x местный номер");
    expect(accommodations[0]?.comfort).toBe("Премиум");
  });
});
