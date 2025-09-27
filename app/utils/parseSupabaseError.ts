export const parseSupabaseError = (err: unknown): string => {
  if (!err) return 'Unknown error';
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const maybe = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const fields = [maybe.message, maybe.details, maybe.hint, maybe.code].filter(
      (field): field is string => typeof field === 'string' && field.trim().length > 0
    );
    if (fields.length) {
      return fields.join(' — ');
    }
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};
