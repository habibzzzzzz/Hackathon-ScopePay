import { Pending } from "@/shared/presentation/pending";
export default function Loading() {
  return (
    <main id="main-content" className="auth-shell">
      <Pending label="Loading ScopePay..." />
    </main>
  );
}
