import type { AuthProvider, AuthResult } from "@/lib/auth-provider";
import { toSessionUser } from "@/lib/auth-session";
import { joinFullName, splitFullName } from "@/lib/full-name";
import type { AccountRole, SessionUser, User } from "@/types/user";
import {
  DEFAULT_ORGANIZER_OWNER_ID,
  normalizeAccountRoles,
  userHasAccountRole,
} from "@/types/user";
import { DEFAULT_PROFILE_COUNTRY, resolvePhoneCountryIsoFromProfile } from "@/data/profile-countries";
import {
  DEFAULT_PHONE_COUNTRY,
  buildInternationalPhone,
  getPhoneCountry,
  parseInternationalPhone,
} from "@/lib/phone-countries";
import type { StoredAuthUser } from "@/types/auth";

const SESSION_KEY = "argentina-travel-auth-session";
const USERS_KEY = "argentina-travel-auth-users";
const OVERRIDES_KEY = "argentina-travel-auth-overrides";

export const DEMO_PASSWORD = "demo123";

/** Production requires explicit password; dev may fall back to demo password. */
export function resolvePasswordInput(input?: string): string {
  const value = input?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") return "";
  return DEMO_PASSWORD;
}

export const SEED_USERS: StoredAuthUser[] = [
  {
    id: DEFAULT_ORGANIZER_OWNER_ID,
    role: "tourist",
    roles: ["tourist", "organizer"],
    firstName: "Иван",
    lastName: "Евдокимычев",
    phone: "+79999226564",
    email: "IAEvdokimychev@ya.ru",
    password: DEMO_PASSWORD,
    country: "Россия",
    avatar: null,
    dateOfBirth: "1990-05-15",
    createdAt: "2023-01-01T00:00:00.000Z",
  },
];

function readStoredUsers(): StoredAuthUser[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAuthUser[];
    return Array.isArray(parsed) ? parsed.map(normalizeStoredUser) : [];
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

function normalizeStoredUser(raw: StoredAuthUser): StoredAuthUser {
  const name =
    raw.firstName?.trim()
      ? { firstName: raw.firstName.trim(), lastName: raw.lastName?.trim() ?? "" }
      : splitFullName(raw.fullName ?? "");

  const roles = normalizeAccountRoles({
    role: raw.role,
    roles: raw.roles,
  });

  return {
    ...raw,
    firstName: name.firstName,
    lastName: name.lastName,
    avatar: raw.avatar ?? raw.avatarUrl ?? null,
    roles,
    role: roles.includes(raw.role) ? raw.role : roles[0],
    country: raw.country ?? DEFAULT_PROFILE_COUNTRY,
    dateOfBirth: raw.dateOfBirth ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function applyOverrides(user: StoredAuthUser): StoredAuthUser {
  const override = readProfileOverrides()[user.id];
  if (!override) return normalizeStoredUser(user);
  return normalizeStoredUser({ ...user, ...override });
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

export function getUserById(userId: string): User | null {
  const stored = getAllUsers().find((user) => user.id === userId);
  return stored ? toUserRecord(stored) : null;
}

function toUserRecord(user: StoredAuthUser, activeRole?: AccountRole): User {
  const roles = normalizeAccountRoles(user);
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
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    avatar: user.avatar ?? null,
    country: user.country ?? DEFAULT_PROFILE_COUNTRY,
    dateOfBirth: user.dateOfBirth ?? null,
    createdAt: user.createdAt,
  };
}

function toSession(user: StoredAuthUser, activeRole?: AccountRole): SessionUser {
  return toSessionUser(toUserRecord(user, activeRole));
}

function readSessionPayload(): { id: string; role?: AccountRole } | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id: string; role?: AccountRole };
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionPayload(user: SessionUser | null) {
  if (user) {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id: user.id, role: user.role })
    );
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function readSessionUser(): SessionUser | null {
  const payload = readSessionPayload();
  if (!payload) return null;

  const fresh = getAllUsers().find((user) => user.id === payload.id);
  return fresh ? toSession(fresh, payload.role) : null;
}

export function writeSessionUser(user: SessionUser | null) {
  writeSessionPayload(user);
}

export type LoginErrorCode =
  | "NOT_FOUND"
  | "ROLE_NOT_CONNECTED"
  | "WRONG_ROLE"
  | "INVALID_CREDENTIALS";

function rejectLogin(
  error: string,
  code?: LoginErrorCode
): AuthResult {
  return { error, code };
}

export function loginWithPhone(
  phone: string,
  role: AccountRole
): AuthResult {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { error: "Введите корректный номер телефона" };
  }

  const account = findUserByPhone(normalized);
  if (!account) {
    return rejectLogin("NOT_FOUND", "NOT_FOUND");
  }

  if (!userHasAccountRole(account, role)) {
    return rejectLogin(
      role === "organizer"
        ? "ROLE_NOT_CONNECTED"
        : "Этот номер зарегистрирован как автор тура. Войдите как организатор.",
      role === "organizer" ? "ROLE_NOT_CONNECTED" : "WRONG_ROLE"
    );
  }

  const user = toSession(account, role);
  writeSessionUser(user);
  return { user };
}

export function loginWithEmail(
  email: string,
  password: string,
  role: AccountRole
): AuthResult {
  const account = findUserByEmail(email);
  if (!account) {
    return { error: "Аккаунт с такой почтой не найден. Зарегистрируйтесь по телефону." };
  }

  if (!userHasAccountRole(account, role)) {
    return rejectLogin(
      role === "organizer"
        ? "ROLE_NOT_CONNECTED"
        : "Эта почта зарегистрирована как автор тура.",
      role === "organizer" ? "ROLE_NOT_CONNECTED" : "WRONG_ROLE"
    );
  }

  if (!account.password || account.password !== password) {
    return rejectLogin("Неверный пароль", "INVALID_CREDENTIALS");
  }

  const user = toSession(account, role);
  writeSessionUser(user);
  return { user };
}

export function registerUser(input: {
  role: AccountRole;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password?: string;
}): AuthResult {
  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!normalizedPhone) {
    return { error: "Введите корректный номер телефона" };
  }

  if (!firstName) {
    return { error: "Укажите имя" };
  }

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Укажите корректный email" };
  }

  if (findUserByPhone(normalizedPhone)) {
    return { error: "DUPLICATE_PHONE", code: "DUPLICATE_PHONE" };
  }

  if (findUserByEmail(normalizedEmail)) {
    return { error: "DUPLICATE_EMAIL", code: "DUPLICATE_EMAIL" };
  }

  const roles: AccountRole[] =
    input.role === "organizer" ? ["tourist", "organizer"] : [input.role];

  const user: StoredAuthUser = {
    id: `user-${Date.now()}`,
    role: input.role,
    roles,
    firstName,
    lastName,
    phone: normalizedPhone,
    email: normalizedEmail,
    password: input.password ?? DEMO_PASSWORD,
    country: DEFAULT_PROFILE_COUNTRY,
    avatar: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
  };

  const stored = readStoredUsers();
  stored.push(user);
  writeStoredUsers(stored);

  const sessionUser = toSession(user, input.role);
  writeSessionUser(sessionUser);
  return { user: sessionUser };
}

export function addOrganizerRole(userId: string): AuthResult {
  const current = getAllUsers().find((user) => user.id === userId);
  if (!current) {
    return { error: "Пользователь не найден" };
  }

  const roles = normalizeAccountRoles(current);
  if (roles.includes("organizer")) {
    const user = toSession(current, "organizer");
    writeSessionUser(user);
    return { user };
  }

  const nextRoles: AccountRole[] = [...roles, "organizer"];
  const patch = { roles: nextRoles, role: "organizer" as const };
  const persisted = persistProfilePatch(userId, patch);
  if (persisted.error) {
    return { error: persisted.error };
  }

  const updated = toSession({ ...current, ...patch }, "organizer");
  writeSessionUser(updated);
  return { user: updated };
}

export function loginTouristForOrganizerUpgrade(
  email: string,
  password: string
): AuthResult {
  const account = findUserByEmail(email);
  if (!account) {
    return { error: "Аккаунт с такой почтой не найден." };
  }

  if (!account.password || account.password !== password) {
    return rejectLogin("Неверный пароль", "INVALID_CREDENTIALS");
  }

  const user = toSession(account, "tourist");
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
      user.id === userId ? normalizeStoredUser({ ...user, ...patch }) : user
    );
    writeStoredUsers(stored);
    return {};
  }

  return { error: "Пользователь не найден" };
}

export function updateUserProfile(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    country: string;
    dateOfBirth: string | null;
  }
): AuthResult {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const normalizedPhone = normalizePhone(
    input.phone,
    resolvePhoneCountryIsoFromProfile(input.country)
  );
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!firstName) {
    return { error: "Укажите имя" };
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
    firstName,
    lastName,
    phone: normalizedPhone,
    email: normalizedEmail,
    country,
    dateOfBirth: input.dateOfBirth,
  };

  const persisted = persistProfilePatch(userId, patch);
  if (persisted.error) {
    return { error: persisted.error };
  }

  const updated = toSession({ ...current, ...patch });
  writeSessionUser(updated);
  return { user: updated };
}

export function updateUserAvatar(
  userId: string,
  avatarUrl: string | null
): AuthResult {
  const current = getAllUsers().find((user) => user.id === userId);
  if (!current) {
    return { error: "Пользователь не найден" };
  }

  const patch = { avatar: avatarUrl };
  const persisted = persistProfilePatch(userId, patch);
  if (persisted.error) {
    return { error: persisted.error };
  }

  const updated = toSession({ ...current, ...patch });
  writeSessionUser(updated);
  return { user: updated };
}

export const localAuthProvider: AuthProvider = {
  getSessionUser: readSessionUser,
  loginWithPhone,
  loginWithEmail,
  loginTouristForOrganizerUpgrade,
  register: registerUser,
  addOrganizerRole,
  updateProfile: updateUserProfile,
  updateAvatar: updateUserAvatar,
  async requestPasswordReset(email) {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      return { error: "Укажите корректный email" };
    }
    const account = findUserByEmail(normalized);
    if (!account) {
      return { ok: true };
    }
    return {
      error:
        "В локальном демо-режиме письмо не отправляется. Используйте пароль, заданный при регистрации, или очистите localStorage сайта.",
    };
  },
  logout: logoutUser,
};
