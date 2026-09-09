import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import DashboardPage from '@/features/dashboard/DashboardPage';
import CampaignsPage from '@/features/campaigns/CampaignsPage';
import CampaignEditorPage from '@/features/campaigns/CampaignEditorPage';
import CampaignDetailPage from '@/features/campaigns/CampaignDetailPage';
import ContactsPage from '@/features/contacts/ContactsPage';
import ListsPage from '@/features/contacts/ListsPage';
import TemplatesPage from '@/features/templates/TemplatesPage';
import TemplateEditorPage from '@/features/templates/TemplateEditorPage';
import { ROUTES } from './routes';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.campaigns, element: <CampaignsPage /> },
      { path: ROUTES.campaignNew, element: <CampaignEditorPage /> },
      { path: ROUTES.campaignDetail(), element: <CampaignDetailPage /> },
      { path: ROUTES.contacts, element: <ContactsPage /> },
      { path: ROUTES.lists, element: <ListsPage /> },
      { path: ROUTES.templates, element: <TemplatesPage /> },
      { path: ROUTES.templateNew, element: <TemplateEditorPage /> },
      { path: ROUTES.templateDetail(), element: <TemplateEditorPage /> },
      { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
    ],
  },
]);
