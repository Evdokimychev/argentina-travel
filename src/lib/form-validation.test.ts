import { describe, expect, it } from "vitest";
import {
  combineValidators,
  requiredField,
  validateBookingCode,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/form-validation";

describe("smart form validation", () => {
  it("returns specific email errors", () => {
    expect(validateEmail("")).toBe("Укажите email");
    expect(validateEmail("mail@localhost")).toContain("name@example.com");
    expect(validateEmail("mail@example.com")).toBeNull();
  });

  it("explains how many password characters are missing", () => {
    expect(validatePassword(8)("12345")).toBe("Добавьте ещё 3 символа");
    expect(validatePassword(8)("12345678")).toBeNull();
  });

  it("validates password confirmation and booking code", () => {
    expect(validatePasswordConfirmation("secret12")("secret13")).toBe("Пароли не совпадают");
    expect(validateBookingCode("123")).toContain("6 цифр");
    expect(validateBookingCode("123456")).toBeNull();
  });

  it("combines reusable rules in order", () => {
    const validator = combineValidators(requiredField("Название"), (value) => value.length < 3 ? "Слишком коротко" : null);
    expect(validator(" ")).toBe("Укажите название");
    expect(validator("да")).toBe("Слишком коротко");
    expect(validator("Анды")).toBeNull();
  });
});
