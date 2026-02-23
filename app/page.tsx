import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/dashboard-client";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <DashboardClient />;
}
