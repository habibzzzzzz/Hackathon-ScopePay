import { redirect } from "next/navigation";
export default async function Analyze({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/projects/${id}#analysis`);
}
