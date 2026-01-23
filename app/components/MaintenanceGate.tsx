import { headers } from "next/headers";
import Setting from "@/models/Setting";
import dbConnect from "@/lib/db";
import MaintenancePage from "@/app/maintenance/page";
import AnnouncementBar from "./AnnouncementBar";

export default async function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  await dbConnect();

  // Fetch Site Settings (Parallel)
  let isMaintenance = false;
  let showAnnouncement = false;
  let announcementMessage = "";

  try {
    const settings = await Setting.find({
      key: {
        $in: [
          "maintenance_mode",
          "announcement_active",
          "announcement_message",
        ],
      },
    });

    const config = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    isMaintenance = !!config.maintenance_mode;
    showAnnouncement = !!config.announcement_active;
    announcementMessage = config.announcement_message || "";
  } catch (e) {
    console.error("Failed to check site settings", e);
  }

  // Check Current Path
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Allow Admin Access
  const isInternal =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api");

  if (isMaintenance && !isInternal) {
    return <MaintenancePage />;
  }

  return (
    <>
      {showAnnouncement && <AnnouncementBar message={announcementMessage} />}
      {children}
    </>
  );
}
