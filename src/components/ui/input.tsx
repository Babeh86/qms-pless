import * as React from "react";
import { cn } from "@/lib/utils/cn";

const BASE =
  "w-full rounded-lg border bg-white text-ink-900 shadow-xs transition-[border-color,box-shadow] duration-150 " +
  "placeholder:text-ink-400 " +
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500 " +
  "aria-[invalid=true]:border-danger-400 aria-[invalid=true]:ring-danger-400/10";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  inputSize?: "sm" | "md";
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, inputSize = "md", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        BASE,
        inputSize === "sm" ? "h-8 px-2.5 text-xs" : "h-9.5 px-3 text-sm",
        invalid ? "border-danger-400" : "border-ink-300",
        className,
      )}
      {...props}
    />
  );
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        BASE,
        "h-9.5 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9 pl-3 text-sm",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2364748b%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.75%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')]",
        invalid ? "border-danger-400" : "border-ink-300",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        BASE,
        "min-h-20 resize-y px-3 py-2 text-sm",
        invalid ? "border-danger-400" : "border-ink-300",
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-xs font-medium text-ink-700">
        {label}
        {required ? (
          <span className="text-danger-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
