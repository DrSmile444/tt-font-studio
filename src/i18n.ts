import { en, type LocaleMessages, type MessageKey } from "./locales/en";
export type { MessageKey, LocaleMessages };
let messages: LocaleMessages = {};
export function setLocale(locale: string, translations: LocaleMessages = {}) {
  messages = translations;
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}
export function t(
  key: MessageKey,
  values: Record<string, string | number> = {},
): string {
  return (messages[key] ?? en[key]).replace(
    /\{(\w+)\}/g,
    (token, name: string) => String(values[name] ?? token),
  );
}
