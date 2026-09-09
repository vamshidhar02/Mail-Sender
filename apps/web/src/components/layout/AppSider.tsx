import {
  DashboardOutlined,
  MailOutlined,
  SendOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/routes';

const { Sider } = Layout;

const items = [
  { key: ROUTES.dashboard, icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: ROUTES.campaigns, icon: <SendOutlined />, label: 'Campaigns' },
  { key: ROUTES.contacts, icon: <TeamOutlined />, label: 'Contacts' },
  { key: ROUTES.lists, icon: <UnorderedListOutlined />, label: 'Lists' },
  { key: ROUTES.templates, icon: <MailOutlined />, label: 'Templates' },
];

export function AppSider({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Longest matching prefix wins, so /campaigns/abc still highlights Campaigns.
  const selected =
    items
      .map((item) => item.key)
      .filter((key) => key !== ROUTES.dashboard && pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0] ?? ROUTES.dashboard;

  return (
    <Sider collapsible collapsed={collapsed} trigger={null} width={220}>
      <div className="flex h-16 items-center gap-2 px-4 text-white">
        <MailOutlined className="text-xl" />
        {!collapsed && <span className="text-base font-semibold">Mail Sender</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selected]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}
