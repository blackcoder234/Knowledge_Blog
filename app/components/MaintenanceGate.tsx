import { headers } from "next/headers";
import Setting from "@/models/Setting";
import dbConnect from "@/lib/db";
import MaintenancePage from "@/app/maintenance/page";

export default async function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  await dbConnect();

  // Fetch Maintenance Mode Setting
  // We use findOne since 'key' is unique
  let isMaintenance = false;
  try {
    const setting = await Setting.findOne({ key: "maintenance_mode" });
    if (setting && setting.value === true) {
      isMaintenance = true;
    }
  } catch (e) {
    console.error("Failed to check maintenance mode", e);
  }

  // Check Current Path
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Allow Admin Access
  const isAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api");

  if (isMaintenance && !isAdmin) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
