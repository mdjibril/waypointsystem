/**
 * Combines multiple class names into a single string.
 * Supports conditional classes passed as objects, arrays, or strings.
 */
export function cn(...inputs: (string | boolean | undefined | null | Record<string, boolean> | string[])[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (Array.isArray(input)) {
      classes.push(cn(...input));
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.filter(Boolean).join(" ");
}
