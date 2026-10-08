import "server-only";
import { cache } from "react";
import { requireSession } from "./auth";
import { runtime } from "./runtime";
export const workspaceData = cache(async () => {
  const user = await requireSession(true);
  const { service } = await runtime();
  return { user, workspace: await service.workspace(user.id) };
});
