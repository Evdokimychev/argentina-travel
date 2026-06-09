import type { AuthUser, AuthUserRole, StoredAuthUser } from "@/types/auth";
import { normalizeUserRoles, userHasRole } from "@/types/auth";
import { DEFAULT_PROFILE_COUNTRY } from "@/data/profile-countries";
import {
  DEFAULT_PHONE_COUNTRY,
  buildInternationalPhone,
  getPhoneCountry,
  parseInternationalPhone,
} from "@/lib/phone-countries";

const SESSION_KEY = "argentina-travel-auth-session";
const USERS_KEY = "argentina-travel-auth-users";
const OVERRIDES_KEY = "argentina-travel-auth-overrides";

export const DEMO_PASSWORD = "demo123";

export const SEED_USERS: StoredAuthUser[] = [
  {
    id: "ivan-evdokimychev",
    role: "tourist",
    fullName: "Иван Евдокимычев",
    phone: "+79999226564",
    email: "IAEvdokimychev@ya.ru",
    password: DEMO_PASSWORD,
    country: "Россия",
    avatarUrl: null,
    dateOfBirth: "1990-05-15",
    roles: ["tourist"],
  },
];

function readStoredUsers(): StoredAuthUser[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAuthUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredUsers(users: StoredAuthUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readProfileOverrides(): Record<string, Partial<StoredAuthUser>> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<StoredAuthUser>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfileOverrides(overrides: Record<string, Partial<StoredAuthUser>>) {
  window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

function applyOverrides(user: StoredAuthUser): StoredAuthUser {
  const override = readProfileOverrides()[user.id];
  if (!override) return user;
  return { ...user, ...override };
}

export function getAllUsers(): StoredAuthUser[] {
  const byId = new Map<string, StoredAuthUser>();

  for (const user of SEED_USERS) {
    byId.set(user.id, applyOverrides(user));
  }

  for (const user of readStoredUsers()) {
    byId.set(user.id, applyOverrides(user));
  }

  return Array.from(byId.values());
}

export function normalizePhone(input: string, countryIso?: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parsedInternational = parseInternationalPhone(trimmed);
  if (parsedInternational) {
    const { country, nationalDigits } = parsedInternational;
    if (!nationalDigits || nationalDigits.length < country.nationalLength - 1) {
      return null;
    }
    return buildInternationalPhone(country, nationalDigits);
  }

  const country = getPhoneCountry(countryIso ?? DEFAULT_PHONE_COUNTRY.iso);
  const nationalDigits = trimmed.replace(/\D/g, "");

  if (nationalDigits.length < country.nationalLength - 1) {
    return null;
  }

  return buildInternationalPhone(country, nationalDigits.slice(0, country.nationalLength));
}

export function formatPhoneInput(value: string, countryIso?: string): string {
  const country = getPhoneCountry(countryIso ?? DEFAULT_PHONE_COUNTRY.iso);
  const digits = value.replace(/\D/g, "").slice(0, country.nationalLength);

  if (country.iso === "RU" || country.iso === "KZ") {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function findUserByPhone(phone: string): StoredAuthUser | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  return getAllUsers().find((user) => user.phone === normalized) ?? null;
}

export function findUserByEmail(email: string): StoredAuthUser | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  return getAllUsers().find((user) => user.email.toLowerCase() === normalized) ?? null;
}

function toAuthUser(user: StoredAuthUser, activeRole?: AuthUserRole): AuthUser {
  const roles = normalizeUserRoles(user);
  const role =
    activeRole && roles.includes(activeRole)
      ? activeRole
      : roles.includes(user.role)
        ? user.role
        : roles[0];

  return {
    id: user.id,
    role,
    roles,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    country: user.country ?? DEFAULT_PROFILE_COUNTRY,
    dateOfBirth: user.dateOfBirth ?? null,
  };
}

export function readSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthUser;
    const fresh = getAllUsers().find((user) => user.id === parsed.id);
    return fresh ? toAuthUser(fresh) : null;
  } catch {
    return null;
  }
}

export function writeSessionUser(user: AuthUser | null) {
  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export type LoginErrorCode =
  | "NOT_FOUND"
  | "ROLE_NOT_CONNECTED"
  | "WRONG_ROLE"
  | "INVALID_CREDENTIALS";

export function loginWithPhone(
  phone: string,
  role: AuthUserRole
): { user: AuthUser } | { error: string; code?: LoginErrorCode } {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { error: "Введите корректный номер телефона" };
  }

  const account = findUserByPhone(normalized);
  if (!account) {
    return { error: "NOT_FOUND", code: "NOT_FOUND" };
  }

  if (!userHasRole(account, role)) {
    return {
      error:
        role === "organizer"
          ? "ROLE_NOT_CONNECTED"
          : "Этот номер зарегистрирован как автор тура. Войдите как организатор.",
      code: role === "organizer" ? "ROLE_NOT_CONNECTED" : "WRONG_ROLE",
    };
  }

  const user = toAuthUser(account, role);

  writeSessionUser(user);
  return { user };
}

export function loginWithEmail(
  email: string,
  password: string,
  role: AuthUserRole
): { user: AuthUser } | { error: string; code?: LoginErrorCode } {
  const account = findUserByEmail(email);
  if (!account) {
    return { error: "Аккаунт с такой почтой не найден. Зарегистрируйтесь по телефону." };
  }

  if (!userHasRole(account, role)) {
    return {
      error:
        role === "organizer"
          ? "ROLE_NOT_CONNECTED"
          : "Эта почта зарегистрирована как автор тура.",
      code: role === "organizer" ? "ROLE_NOT_CONNECTED" : "WRONG_ROLE",
    };
  }

  if (!account.password || account.password !== password) {
    return { error: "Неверный пароль", code: "INVALID_CREDENTIALS" };
  }

  const user = toAuthUser(account, role);

  writeSessionUser(user);
  return { user };
}

export function registerUser(input: {
  role: AuthUserRole;
  fullName: string;
  phone: string;
  email: string;
  password?: string;
}): { user: AuthUser } | { error: string; code?: "DUPLICATE_PHONE" | "DUPLICATE_EMAIL" } {
  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!normalizedPhone) {
    return { error: "Введите корректный номер телефона" };
  }

  if (!fullName) {
    return { error: "Укажите имя и фамилию" };
  }

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Укажите корректный email" };
  }

  if (findUserByPhone(normalizedPhone)) {
    return { error: "DUPLICATE_PHONE", code: "DUPLICATE_PHONE" as const };
  }

  if (findUserByEmail(normalizedEmail)) {
    return { error: "DUPLICATE_EMAIL", code: "DUPLICATE_EMAIL" as const };
  }

  const roles: AuthUserRole[] =
    input.role === "organizer" ? ["tourist", "organizer"] : [input.role];

  const user: StoredAuthUser = {
    id: `user-${Date.now()}`,
    role: input.role,
    roles,
    fullName,
    phone: normalizedPhone,
    email: normalizedEmail,
    password: input.password ?? DEMO_PASSWORD,
    country: DEFAULT_PROFILE_COUNTRY,
    avatarUrl: null,
    dateOfBirth: null,
  };

  const stored = readStoredUsers();
  stored.push(user);
  writeStoredUsers(stored);

  const sessionUser = toAuthUser(user, input.role);

  writeSessionUser(sessionUser);
  return { user: sessionUser };
}

export function addOrganizerRole(userId: string): { user: AuthUser } | { error: string } {
  const current = getAllUsers().find((user) => user.id === userId);
  if (!current) {
    return { error: "Пользователь не найден" };
  }

  const roles = normalizeUserRoles(current);
  if (roles.includes("organizer")) {
    const user = toAuthUser(current, "organizer");
    writeSessionUser(user);
    return { user };
  }

  const nextRoles: AuthUserRole[] = [...roles, "organizer"];
  const patch = { roles: nextRoles, role: "organizer" as const };
  const persisted = persistProfilePatch(userId, patch);
  if (persisted.error) {
    return { error: persisted.error };
  }

  const updated = toAuthUser({ ...current, ...patch }, "organizer");
  writeSessionUser(updated);
  return { user: updated };
}

export function loginTouristForOrganizerUpgrade(
  email: string,
  password: string
): { user: AuthUser } | { error: string; code?: LoginErrorCode } {
  const account = findUserByEmail(email);
  if (!account) {
    return { error: "Аккаунт с такой почтой не найден." };
  }

  if (!account.password || account.password !== password) {
    return { error: "Неверный пароль", code: "INVALID_CREDENTIALS" };
  }

  const user = toAuthUser(account, "tourist");
  writeSessionUser(user);
  return { user };
}

export function logoutUser() {
  writeSessionUser(null);
}

function persistProfilePatch(userId: string, patch: Partial<StoredAuthUser>): { error?: string } {
  const isSeedUser = SEED_USERS.some((user) => user.id === userId);
  const isStoredUser = readStoredUsers().some((user) => user.id === userId);

  if (isSeedUser) {
    const overrides = readProfileOverrides();
    overrides[userId] = { ...overrides[userId], ...patch };
    writeProfileOverrides(overrides);
    return {};
  }

  if (isStoredUser) {
    const stored = readStoredUsers().map((user) =>
      user.id === userId ? { ...user, ...patch } : user
    );
    writeStoredUsers(stored);
    return {};
  }

  return { error: "Пользователь не найден" };
}

export function updateUserProfile(
  userId: string,
  input: {
    fullName: string;
    phone: string;
    email: string;
    country: string;
    dateOfBirth: string | null;
  }
): { user: AuthUser } | { error: string } {
  const fullName = input.fullName.trim();
  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!fullName) {
    return { error: "Укажите имя и фамилию" };
  }

  if (!normalizedPhone) {
    return { error: "Введите корректный номер телефона" };
  }

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Укажите корректный email" };
  }

  const country = input.country.trim();
  if (!country) {
    return { error: "Выберите страну" };
  }

  const current = getAllUsers().find((user) => user.id === userId);
  if (!current) {
    return { error: "Пользователь не найден" };
  }

  const phoneTaken = getAllUsers().some(
    (user) => user.id !== userId && user.phone === normalizedPhone
  );
  if (phoneTaken) {
    return { error: "Этот телефон уже используется другим аккаунтом" };
  }

  const emailTaken = getAllUsers().some(
    (user) => user.id !== userId && user.email.toLowerCase() === normalizedEmail
  );
  if (emailTaken) {
    return { error: "Эта почта уже используется другим аккаунтом" };
  }

  const patch = {
    fullName,
    phone: normalizedPhone,
    email: normalizedEmail,
    country,
    dateOfBirth: input.dateOfBirth,
  };

  const persisted = persistProfilePatch(userId, patch);
  if (persisted.error) {
    return { error: persisted.error };
  }

  const updated = toAuthUser({ ...current, ...patch });

  writeSessionUser(updated);
  return { user: updated };
}

export function updateUserAvatar(
  userId: string,
  avatarUrl: string | null
): { user: AuthUser } | { error: string } {
  const current = getAllUsers().find((user) => user.id === userId);
  if (!current) {
    return { error: "Пользователь не найден" };
  }

  const persisted = persistProfilePatch(userId, { avatarUrl });
  if (persisted.error) {
    return { error: persisted.error };
  }

  const updated = toAuthUser({ ...current, avatarUrl });
  writeSessionUser(updated);
  return { user: updated };
}
