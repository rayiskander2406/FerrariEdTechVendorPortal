"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { FeatureFlagsProvider } from "@/lib/features";
import { DemoProvider } from "@/lib/demo";
import { VendorProvider } from "@/lib/contexts";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <FeatureFlagsProvider>
      <VendorProvider>
        <DemoProvider>
          <ToastProvider>{children}</ToastProvider>
        </DemoProvider>
      </VendorProvider>
    </FeatureFlagsProvider>
  );
}
