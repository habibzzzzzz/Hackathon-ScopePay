import Link from "next/link";
import { formatMoney, type Currency } from "@/shared/domain/money";
export function Brand() {
  return (
    <Link className="brand" href="/">
      ScopePay<span>.ai</span>
    </Link>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value.toLowerCase()}`}>
      {value.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Empty({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Link className="button primary" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
export function Money({
  minor,
  currency,
}: {
  minor: number;
  currency: Currency;
}) {
  return <span className="money">{formatMoney(minor, currency)}</span>;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Stat({
  label,
  minor,
  currency,
  detail,
}: {
  label: string;
  minor: number;
  currency: Currency;
  detail: string;
}) {
  return (
    <div className="stat">
      <p>{label}</p>
      <strong>
        <Money minor={minor} currency={currency} />
      </strong>
      <small>{detail}</small>
    </div>
  );
}
