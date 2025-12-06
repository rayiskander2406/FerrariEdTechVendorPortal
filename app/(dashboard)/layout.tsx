/**
 * Dashboard Layout
 *
 * Layout wrapper for all dashboard routes using DashboardLayout component.
 * Applies consistent sidebar + topnav + main content structure.
 */

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get vendor info from session/auth context
  const vendorName = 'Demo Vendor';
  const tier = 'PRIVACY_SAFE' as const;
  const notificationCount = 3;

  return (
    <DashboardLayout
      vendorName={vendorName}
      tier={tier}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardLayout>
  );
}
