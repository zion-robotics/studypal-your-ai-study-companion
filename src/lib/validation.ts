export function validateName(name: string): string | null {
  const v = name.trim();
  if (!v) return "Please enter your name";
  if (v.length < 2) return "Please enter your real name (letters only)";
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v)) return "Please enter your real name (letters only)";
  return null;
}

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Enter your email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address (e.g. you@gmail.com)";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Enter a password";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/\d/.test(password)) return "Add at least one number to your password";
  if (!/[A-Za-z]/.test(password)) return "Add at least one letter to your password";
  return null;
}

export type PwStrength = { score: 0 | 1 | 2 | 3; label: string; color: string };

export function passwordStrength(password: string): PwStrength {
  if (password.length === 0) return { score: 0, label: "", color: "bg-muted" };
  if (password.length < 8) return { score: 0, label: "Too short", color: "bg-red-500" };
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  if (!(hasLetter && hasNumber)) return { score: 1, label: "Weak", color: "bg-amber-500" };
  if (password.length >= 12 && hasSymbol) return { score: 3, label: "Strong", color: "bg-accent" };
  return { score: 2, label: "Good", color: "bg-accent" };
}

export function friendlyAuthError(message: string): { text: string; linkTo?: "/login" | "/signup" } {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already"))
    return { text: "An account with this email already exists. Log in instead?", linkTo: "/login" };
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return { text: "Incorrect email or password. Try again — or", linkTo: "/signup" };
  if (m.includes("email not confirmed"))
    return { text: "Please confirm your email first. Check your inbox." };
  if (m.includes("user not found"))
    return { text: "No account found with this email. Sign up instead?", linkTo: "/signup" };
  if (m.includes("invalid email")) return { text: "That email doesn't look right. Check and try again." };
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to") || m.includes("placeholder.supabase"))
    return { text: "Connection problem. Check your internet and try again." };
  return { text: message };
}