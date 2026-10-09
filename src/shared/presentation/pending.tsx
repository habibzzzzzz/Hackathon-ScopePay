export function Pending({ label }: { label: string }) {
  return (
    <span className="pending" role="status" aria-live="polite">
      <span className="pending-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
