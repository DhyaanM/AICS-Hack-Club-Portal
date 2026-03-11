import { SharedDashboardLayout } from "@/components/dashboard/shared-layout"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <SharedDashboardLayout>{children}</SharedDashboardLayout>
}
