import type { ReactNode } from "react";

import { Sidebar, type DemoStorySection } from "@/components/layout/sidebar";

export function AppShell({
  header,
  children,
  activeSection,
  onSectionChange,
}: {
  header: ReactNode;
  children: ReactNode;
  activeSection: DemoStorySection;
  onSectionChange: (section: DemoStorySection) => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1500px] gap-5 px-4 py-5 lg:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        </aside>
        <main className="flex-1 space-y-6">{header}{children}</main>
      </div>
    </div>
  );
}
