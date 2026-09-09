import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { selectSiderCollapsed } from '@/features/ui/uiSlice';
import { AppSider } from './AppSider';
import { AppHeader } from './AppHeader';

const { Content } = Layout;

export function AppLayout() {
  const collapsed = useAppSelector(selectSiderCollapsed);

  return (
    <Layout className="h-full">
      <AppSider collapsed={collapsed} />
      <Layout>
        <AppHeader />
        <Content className="overflow-auto p-6">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
            
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
