export type ZodIssue = {
  path: Array<string | number>;
  message: string;
};

export type SafeParseSuccess<T> = {
  success: true;
  data: T;
};

export type SafeParseFailure = {
  success: false;
  error: {
    issues: ZodIssue[];
  };
};

export type SafeParseReturnType<T> = SafeParseSuccess<T> | SafeParseFailure;

export interface ZodSchema<T> {
  readonly _output: T;
  safeParse(input: unknown): SafeParseReturnType<T>;
}

class ZodString implements ZodSchema<string> {
  public readonly _output!: string;
  private readonly checks: Array<{
    kind: "min" | "regex" | "email";
    value?: number | RegExp;
    message?: string;
  }> = [];
  private trimValue = false;

  trim(): ZodString {
    this.trimValue = true;
    return this;
  }

  min(length: number, message?: string): ZodString {
    this.checks.push({ kind: "min", value: length, message });
    return this;
  }

  regex(pattern: RegExp, message?: string): ZodString {
    this.checks.push({ kind: "regex", value: pattern, message });
    return this;
  }

  email(message?: string): ZodString {
    this.checks.push({ kind: "email", message });
    return this;
  }

  safeParse(input: unknown): SafeParseReturnType<string> {
    if (typeof input !== "string") {
      return {
        success: false,
        error: {
          issues: [
            {
              path: [],
              message: "Expected string",
            },
          ],
        },
      };
    }

    let value = input;
    if (this.trimValue) {
      value = value.trim();
    }

    for (const check of this.checks) {
      if (check.kind === "min") {
        const length = Number(check.value) || 0;
        if (value.length < length) {
          return {
            success: false,
            error: {
              issues: [
                {
                  path: [],
                  message: check.message ?? `Must be at least ${length} characters long`,
                },
              ],
            },
          };
        }
      } else if (check.kind === "regex") {
        const pattern = check.value as RegExp;
        if (!pattern.test(value)) {
          return {
            success: false,
            error: {
              issues: [
                {
                  path: [],
                  message: check.message ?? "Invalid format",
                },
              ],
            },
          };
        }
      } else if (check.kind === "email") {
        // Basic RFC 5322 compliant email pattern
        const emailPattern =
          /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i;
        if (!emailPattern.test(value)) {
          return {
            success: false,
            error: {
              issues: [
                {
                  path: [],
                  message: check.message ?? "Invalid email address",
                },
              ],
            },
          };
        }
      }
    }

    return { success: true, data: value };
  }
}

class ZodObject<Shape extends Record<string, ZodSchema<any>>> implements ZodSchema<{
  [K in keyof Shape]: Shape[K]["_output"];
}> {
  public readonly _output!: { [K in keyof Shape]: Shape[K]["_output"] };

  constructor(private readonly shape: Shape) {}

  safeParse(input: unknown): SafeParseReturnType<{ [K in keyof Shape]: Shape[K]["_output"] }> {
    if (typeof input !== "object" || input === null) {
      return {
        success: false,
        error: {
          issues: [
            {
              path: [],
              message: "Expected object",
            },
          ],
        },
      };
    }

    const output: Record<string, unknown> = {};
    const issues: ZodIssue[] = [];

    for (const key of Object.keys(this.shape) as Array<keyof Shape>) {
      const schema = this.shape[key];
      const rawValue = (input as Record<string, unknown>)[key as string];
      const result = schema.safeParse(rawValue);
      if (result.success) {
        output[key as string] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({
            path: [key as string, ...issue.path],
            message: issue.message,
          });
        }
      }
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: { issues },
      };
    }

    return {
      success: true,
      data: output as { [K in keyof Shape]: Shape[K]["_output"] },
    };
  }
}

export const z = {
  string(): ZodString {
    return new ZodString();
  },
  object<Shape extends Record<string, ZodSchema<any>>>(shape: Shape): ZodObject<Shape> {
    return new ZodObject(shape);
  },
};

export namespace z {
  export type infer<T extends ZodSchema<any>> = T["_output"];
}
