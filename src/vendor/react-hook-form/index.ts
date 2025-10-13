import { useCallback, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

export type FieldError = {
  type?: string;
  message?: string;
};

export type FieldErrors<TFieldValues> = {
  [K in keyof TFieldValues]?: FieldError;
};

export type ResolverResult<TFieldValues> = {
  values?: TFieldValues;
  errors: FieldErrors<TFieldValues>;
};

export type Resolver<TFieldValues> = (
  values: TFieldValues,
) => ResolverResult<TFieldValues> | Promise<ResolverResult<TFieldValues>>;

export type SubmitHandler<TFieldValues> = (values: TFieldValues) => void | Promise<void>;

export type SubmitErrorHandler<TFieldValues> = (
  errors: FieldErrors<TFieldValues>,
) => void | Promise<void>;

export type RegisterReturn = {
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

export interface UseFormOptions<TFieldValues> {
  defaultValues?: Partial<TFieldValues>;
  resolver?: Resolver<TFieldValues>;
}

export interface UseFormReturn<TFieldValues> {
  register: (name: keyof TFieldValues & string) => RegisterReturn;
  handleSubmit: (
    onValid: SubmitHandler<TFieldValues>,
    onInvalid?: SubmitErrorHandler<TFieldValues>,
  ) => (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  watch: <K extends keyof TFieldValues>(name: K) => TFieldValues[K] | undefined;
  setError: (name: keyof TFieldValues, error: FieldError) => void;
  clearErrors: (name?: keyof TFieldValues) => void;
  formState: {
    errors: FieldErrors<TFieldValues>;
    isSubmitting: boolean;
    submitCount: number;
  };
}

export function useForm<TFieldValues extends Record<string, any>>(
  options: UseFormOptions<TFieldValues> = {},
): UseFormReturn<TFieldValues> {
  const resolver = options.resolver;
  const [values, setValues] = useState<TFieldValues>(() => {
    return { ...(options.defaultValues as TFieldValues) };
  });
  const [errors, setErrors] = useState<FieldErrors<TFieldValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitCountRef = useRef(0);

  const setFieldValue = useCallback((name: keyof TFieldValues, value: string) => {
    setValues((prev) => ({
      ...(prev ?? ({} as TFieldValues)),
      [name]: value,
    }));
  }, []);

  const register = useCallback(
    (name: keyof TFieldValues & string): RegisterReturn => ({
      name,
      value: (values?.[name as keyof TFieldValues] as string | undefined) ?? "",
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        setFieldValue(name, next);
        if (errors[name as keyof TFieldValues]) {
          setErrors((prev) => {
            const nextErrors = { ...prev };
            delete nextErrors[name as keyof TFieldValues];
            return nextErrors;
          });
        }
      },
      onBlur: () => {
        /* no-op hook for parity with react-hook-form */
      },
    }),
    [errors, setFieldValue, values],
  );

  const validate = useCallback(async () => {
    if (!resolver) {
      return { values, errors: {} as FieldErrors<TFieldValues> };
    }

    const result = await resolver(values);
    return {
      values: (result.values ?? values) as TFieldValues,
      errors: result.errors ?? ({} as FieldErrors<TFieldValues>),
    };
  }, [resolver, values]);

  const handleSubmit = useCallback(
    (
      onValid: SubmitHandler<TFieldValues>,
      onInvalid?: SubmitErrorHandler<TFieldValues>,
    ) =>
      async (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault?.();
        submitCountRef.current += 1;
        setIsSubmitting(true);

        try {
          const { values: parsedValues, errors: validationErrors } = await validate();
          const hasErrors = Object.keys(validationErrors ?? {}).length > 0;

          if (hasErrors) {
            setErrors(validationErrors);
            await onInvalid?.(validationErrors);
            return;
          }

          setErrors({});
          await onValid(parsedValues);
        } finally {
          setIsSubmitting(false);
        }
      },
    [validate],
  );

  const watch = useCallback(
    <K extends keyof TFieldValues>(name: K) => {
      return values?.[name];
    },
    [values],
  );

  const setError = useCallback((name: keyof TFieldValues, error: FieldError) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const clearErrors = useCallback((name?: keyof TFieldValues) => {
    if (typeof name === "undefined") {
      setErrors({});
      return;
    }

    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
  }, []);

  const formState = useMemo(
    () => ({
      errors,
      isSubmitting,
      submitCount: submitCountRef.current,
    }),
    [errors, isSubmitting],
  );

  return {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState,
  };
}
