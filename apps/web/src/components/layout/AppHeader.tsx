import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Space, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { signedOut } from '@/features/auth/authSlice';
import { selectSiderCollapsed, siderToggled } from '@/features/ui/uiSlice';
import { useGetSessionQuery } from '@/services/api/authApi';

const { Header } = Layout;
const { Text } = Typography;

export function AppHeader() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSiderCollapsed);
  // Already fetched and cached by RequireAuth, so this is a cache read rather
  // than a second request.
  const { data: session } = useGetSessionQuery();

  const user = session?.user;

  return (
    <Header className="flex items-center justify-between border-b border-slate-200 px-4">
      <Button
        type="text"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => dispatch(siderToggled())}
      />

      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            {
              key: 'signout',
              icon: <LogoutOutlined />,
              label: 'Sign out',
              // Nothing to call server-side: the API keeps no session, so
              // dropping the token is the whole of signing out.
              onClick: () => dispatch(signedOut()),
            },
          ],
        }}
      >
        <Space className="cursor-pointer" size="small">
          <Avatar size="small" src={user?.avatarUrl ?? undefined} icon={<UserOutlined />} />
          <Text className="hidden sm:inline">{user?.name ?? user?.email ?? 'Account'}</Text>
        </Space>
      </Dropdown>
    </Header>
  );
}
