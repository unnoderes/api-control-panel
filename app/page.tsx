'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ControlPanelShell } from '@/components/control-panel';
import { useControlPanelData, useDashboardUiState } from '@/hooks/use-control-panel-data';
import { bffClient } from '@/lib/api/bff-client';

export default function DashboardPage() {
  const router = useRouter();
  const ui = useDashboardUiState();
  const { data, createToken, createTokenPending } = useControlPanelData(ui.activeTab);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    bffClient.auth
      .session()
      .then((session) => {
        if (cancelled) {
          return;
        }
        if (!session.isAuthenticated) {
          router.replace('/login');
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        if (!cancelled) {
          router.replace('/login');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authChecked) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">Checking session...</div>;
  }

  return (
    <ControlPanelShell
      activeTab={ui.activeTab}
      searchText={ui.searchText}
      isDarkMode={ui.isDarkMode}
      isSidebarOpen={ui.isSidebarOpen}
      sidebarWidth={ui.sidebarWidth}
      showMoreMenu={ui.showMoreMenu}
      showNotifMenu={ui.showNotifMenu}
      data={data}
      onTabChange={ui.setActiveTab}
      onSearchTextChange={ui.setSearchText}
      onDarkModeToggle={ui.toggleDarkMode}
      onSidebarToggle={ui.setSidebarOpen}
      onSidebarResizeStart={ui.startSidebarResize}
      onMoreMenuToggle={ui.toggleMoreMenu}
      onNotifMenuToggle={ui.toggleNotifMenu}
      onCreateToken={createToken}
      createTokenPending={createTokenPending}
    />
  );
}
