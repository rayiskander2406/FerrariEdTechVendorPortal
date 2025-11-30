"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { FeatureFlagsProvider } from "@/lib/features";
import { DemoProvider } from "@/lib/demo";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <FeatureFlagsProvider>
      <DemoProvider>
        <ToastProvider>{children}</ToastProvider>
      </DemoProvider>
    </FeatureFlagsProvider>
  );
}
