import { requireSession } from "@/shared/infrastructure/auth";
import { Brand } from "@/shared/presentation/components";
import { Navigation } from "@/shared/presentation/navigation";
import { ActionButton } from "@/shared/presentation/action-button";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession(true);
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <p className="sidebar-caption">Your commercial workspace</p>
        <Navigation />
        <div className="sidebar-bottom">
          <small>{user.demo ? "Isolated demo session" : user.email}</small>
          <ActionButton
            endpoint="/api/auth"
            body={{ action: "logout" }}
            redirectTo="/login"
          >
            Sign out
          </ActionButton>
        </div>
      </aside>
      <main id="main-content" className="workspace-main">
        {user.demo && (
          <div className="demo-banner">
            Demo workspace: sample analysis and simulated payments. No money
            moves.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
