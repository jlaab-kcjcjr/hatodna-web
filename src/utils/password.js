// Same rules as Supabase (Authentication → Email → Password requirements), so forms never let
// through a password the server will reject.
export const PASSWORD_RULES = [
  { label: 'At least 8 characters', short: '8 or more characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', short: 'an uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', short: 'a lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', short: 'a number', test: (p) => /[0-9]/.test(p) },
  { label: 'One symbol, like ! @ # $ % & *', short: 'a symbol', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
];

// e.g. ['an uppercase letter', 'a symbol'], or [] when the password passes every rule.
export function missingRules(password) {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.short);
}