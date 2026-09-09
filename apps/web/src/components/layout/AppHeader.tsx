import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Layout, Tag, Tooltip } from 'antd';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectSiderCollapsed, siderToggled } from '@/features/ui/uiSlice';

const { Header } = Layout;

export function AppHeader() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSiderCollapsed);

  return (
    <Header className="flex items-center justify-between border-b border-slate-200 px-4">
      <Button
        type="text"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => dispatch(siderToggled())}
      />
      <Tooltip title="Every endpoint is currently unauthenticated">
        <Tag color="warning">No auth</Tag>
      </Tooltip>
    </Header>
  );
}
