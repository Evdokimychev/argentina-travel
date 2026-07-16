export type FieldValidator = (value: string) => string | null;

export function requiredField(label: string): FieldValidator {
  return (value) => value.trim() ? null : `Укажите ${label.toLocaleLowerCase("ru")}`;
}

export const validateEmail: FieldValidator = (value) => {
  const normalized = value.trim();
  if (!normalized) return "Укажите email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(normalized)) {
    return "Проверьте email: например, name@example.com";
  }
  return null;
};

export function validatePassword(minLength = 8): FieldValidator {
  return (value) => {
    if (!value) return "Введите пароль";
    if (value.length < minLength) {
      return `Добавьте ещё ${minLength - value.length} ${pluralizeCharacters(minLength - value.length)}`;
    }
    return null;
  };
}

export function validatePasswordConfirmation(password: string): FieldValidator {
  return (value) => {
    if (!value) return "Повторите пароль";
    return value === password ? null : "Пароли не совпадают";
  };
}

export const validateBookingCode: FieldValidator = (value) => {
  if (!value) return "Введите код из письма";
  return /^\d{6}$/u.test(value) ? null : "Код должен состоять из 6 цифр";
};

export function combineValidators(...validators: FieldValidator[]): FieldValidator {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
}

function pluralizeCharacters(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "символ";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "символа";
  return "символов";
}
