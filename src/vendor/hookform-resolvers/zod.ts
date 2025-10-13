import type { Resolver, FieldErrors } from "react-hook-form";
import type { ZodSchema, ZodIssue } from "zod";

type ResolverError = {
  type: string;
  message?: string;
};

function buildErrors<TFieldValues>(issues: ZodIssue[]): FieldErrors<TFieldValues> {
  const fieldErrors: FieldErrors<TFieldValues> = {};

  for (const issue of issues) {
    const [field] = issue.path;
    if (typeof field !== "string") continue;
    if (fieldErrors[field as keyof TFieldValues]) continue;
    fieldErrors[field as keyof TFieldValues] = {
      type: "validation",
      message: issue.message,
    } satisfies ResolverError;
  }

  return fieldErrors;
}

export function zodResolver<TFieldValues extends Record<string, any>>(schema: ZodSchema<TFieldValues>): Resolver<TFieldValues> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} as FieldErrors<TFieldValues> };
    }

    const errors = buildErrors<TFieldValues>(result.error.issues);
    return { values, errors };
  };
}
