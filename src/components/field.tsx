import type { ReactNode } from "react";

export function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="ml-1 text-brand-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[12px] text-ink-400">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-[12px] text-brand-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField(props: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  const { label, name, error, hint, required, ...input } = props;
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required}>
      <input
        id={name}
        name={name}
        className="field"
        aria-invalid={error ? true : undefined}
        required={required}
        {...input}
      />
    </Field>
  );
}

export function TextArea(props: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
}) {
  const { label, name, error, hint, required, ...input } = props;
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required}>
      <textarea
        id={name}
        name={name}
        className="field"
        aria-invalid={error ? true : undefined}
        required={required}
        {...input}
      />
    </Field>
  );
}

export function SelectField(props: {
  label: string;
  name: string;
  options: Array<[value: string, label: string]>;
  error?: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const { label, name, error, hint, required, options, ...input } = props;
  return (
    <Field label={label} name={name} error={error} hint={hint} required={required}>
      <select id={name} name={name} className="field" required={required} {...input}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </Field>
  );
}
