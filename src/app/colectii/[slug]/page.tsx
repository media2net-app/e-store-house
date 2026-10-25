import { notFound, redirect } from "next/navigation";
import { navigationGroups, groupHref } from "@/lib/navigation-groups";

export default async function Collection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!navigationGroups.some(group => group.slug === slug)) notFound();
  redirect(groupHref(slug));
}
