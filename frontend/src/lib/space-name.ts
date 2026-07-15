export const SPACE_NAME_STORAGE_KEY = "helm-space-name";
export const DEFAULT_SPACE_NAME = "Helm";

// localStorage now; a backend field can replace this later without
// changing NavBar's read/write call sites.
export function readSpaceName(): string {
  if (typeof window === "undefined") return DEFAULT_SPACE_NAME;
  return localStorage.getItem(SPACE_NAME_STORAGE_KEY) || DEFAULT_SPACE_NAME;
}

export function writeSpaceName(name: string) {
  const trimmed = name.trim();
  if (trimmed && trimmed !== DEFAULT_SPACE_NAME) {
    localStorage.setItem(SPACE_NAME_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(SPACE_NAME_STORAGE_KEY);
  }
}
