import { SharedDashboardLayout } from "@/components/dashboard/shared-layout"

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
    return <SharedDashboardLayout>{children}</SharedDashboardLayout>
}
