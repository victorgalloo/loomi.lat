import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Redirect direct conversation URLs to the split view
 * /dashboard/conversations/[id] → /dashboard/conversations?id=[id]
 */
export default async function ConversationDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/conversations?id=${id}`);
}
