'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ControlPanelShell } from '@/components/control-panel';
import { useControlPanelData, useDashboardUiState } from '@/hooks/use-control-panel-data';
import { bffClient } from '@/lib/api/bff-client';

export default function DashboardPage() {
  const router = useRouter();
  const ui = useDashboardUiState();
  const { data, createToken, deleteToken, batchDeleteTokens, createTokenPending, refreshTab } = useControlPanelData(ui.activeTab);
  const [authChecked, setAuthChecked] = useState(false);

  const handleLogout = useCallback(async () => {
    await bffClient.auth.logout();
    router.replace('/login');
  }, [router]);

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="size-6 animate-spin text-zinc-500 dark:text-zinc-400" />
      </div>
    );
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
      onDeleteToken={deleteToken}
      onBatchDeleteTokens={batchDeleteTokens}
      onRefreshKeys={() => refreshTab('keys')}
      onLogout={handleLogout}
      createTokenPending={createTokenPending}
    />
  );
}
