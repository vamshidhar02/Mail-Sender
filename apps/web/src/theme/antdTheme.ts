import type { ThemeConfig } from 'antd';

/**
 * Keep these in sync with the @theme block in styles/index.css so Tailwind
 * utilities and Ant Design components agree on the brand colours.
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 8,
    fontSize: 14,
  },
  components: {
    Layout: { headerBg: '#ffffff', siderBg: '#001529', bodyBg: '#f5f7fa' },
    Table: { headerBg: '#fafafa' },
  },
};
