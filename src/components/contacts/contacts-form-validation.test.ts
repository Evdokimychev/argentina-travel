import { describe, expect, it } from "vitest";
import { requiredField, validateEmail } from "@/lib/form-validation";

/** Mirrors ContactsForm submit-time checks so empty/invalid never hit the network first. */
function validateContactFormFields(input: {
  name: string;
  email: string;
  message: string;
}): { nameError: string | null; emailError: string | null; messageError: string | null } {
  return {
    nameError: requiredField("имя")(input.name),
    emailError: validateEmail(input.email),
    messageError:
      input.message.trim().length < 10
        ? "Расскажите немного подробнее — хотя бы 10 символов"
        : null,
  };
}

describe("contacts form submit validation", () => {
  it("blocks empty and invalid fields before network", () => {
    expect(validateContactFormFields({ name: "", email: "", message: "" })).toEqual({
      nameError: "Укажите имя",
      emailError: "Укажите email",
      messageError: "Расскажите немного подробнее — хотя бы 10 символов",
    });

    expect(
      validateContactFormFields({
        name: "Тест",
        email: "invalid-email",
        message: "Достаточно длинное сообщение для формы",
      }).emailError,
    ).toContain("Проверьте email");
  });

  it("accepts a complete valid payload", () => {
    expect(
      validateContactFormFields({
        name: "Анна",
        email: "anna@example.com",
        message: "Планируем поездку в Патагонию в марте",
      }),
    ).toEqual({ nameError: null, emailError: null, messageError: null });
  });
});
