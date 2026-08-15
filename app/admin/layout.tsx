import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/courts");
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 px-5 py-8 md:px-10">{children}</div>
    </div>
  );
}
