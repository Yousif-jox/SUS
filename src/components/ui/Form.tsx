import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldShell({ label, hint, error, htmlFor, required, children }: FieldShellProps) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-[#b42318]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error">{error}</p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, id, required, ...rest }: TextFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fieldId} required={required}>
      <input
        id={fieldId}
        className="input"
        aria-invalid={Boolean(error)}
        required={required}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function SelectField({
  label,
  hint,
  error,
  options,
  id,
  required,
  ...rest
}: SelectFieldProps) {
  const fieldId = id ?? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fieldId} required={required}>
      <select
        id={fieldId}
        className="input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%235c6b63%22 stroke-width=%222%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[right_12px_center] bg-no-repeat pr-10"
        aria-invalid={Boolean(error)}
        required={required}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({ label, hint, error, id, required, ...rest }: TextAreaProps) {
  const fieldId = id ?? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fieldId} required={required}>
      <textarea
        id={fieldId}
        className="input min-h-[104px] resize-y"
        aria-invalid={Boolean(error)}
        required={required}
        {...rest}
      />
    </FieldShell>
  );
}
