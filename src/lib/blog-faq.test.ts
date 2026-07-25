import { describe, expect, it } from "vitest";
import { extractFaqFromBody } from "@/lib/blog-faq";

describe("extractFaqFromBody", () => {
  it("parses manual-from-md numbered bold FAQ", () => {
    const items = extractFaqFromBody(
      [
        "**1. Чем знаменита Мендоса?**",
        "Это винная столица Аргентины и мировой центр Мальбека, у подножия Анд. Сюда едут за дегустациями, гастрономией и горными пейзажами.",
        "",
        "**2. Какие винные зоны выбрать?**",
        "Майпу, Лухан-де-Куйо и Долина Уко. Лучше по дню на каждую.",
        "",
        "**3. Как лучше посещать бодеги?**",
        "Велосипедом, туром или с водителем.",
      ].join("\n"),
    );

    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({
      question: "Чем знаменита Мендоса?",
      answer:
        "Это винная столица Аргентины и мировой центр Мальбека, у подножия Анд. Сюда едут за дегустациями, гастрономией и горными пейзажами.",
    });
    expect(items[1].question).toBe("Какие винные зоны выбрать?");
    expect(items[1].answer).toBe(
      "Майпу, Лухан-де-Куйо и Долина Уко. Лучше по дню на каждую.",
    );
    expect(items[2].question).toBe("Как лучше посещать бодеги?");
    expect(items.every((item) => !item.question.includes("**"))).toBe(true);
    expect(items.every((item) => !/\d+\.\s*$/.test(item.answer))).toBe(true);
  });

  it("keeps intentional bold inside answers", () => {
    const items = extractFaqFromBody(
      "**1. Нужна ли виза?**\nНет для россиян, но нужен паспорт на **6 месяцев**.\n\n**2. Сколько дней?**\nДо 90.",
    );

    expect(items[0].answer).toContain("**6 месяцев**");
    expect(items[0].question).toBe("Нужна ли виза?");
  });

  it("still splits compact plain FAQ", () => {
    expect(
      extractFaqFromBody(
        "Когда ехать? С октября по март. Где остановиться? В Пуэрто-Мадрине.",
      ),
    ).toEqual([
      { question: "Когда ехать?", answer: "С октября по март." },
      { question: "Где остановиться?", answer: "В Пуэрто-Мадрине." },
    ]);
  });
});
