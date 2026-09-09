import type { ReactNode } from 'react';
import { Alert, Skeleton } from 'antd';

import { apiErrorMessage } from '@/lib/apiError';

/**
 * Collapses the three RTK Query states into one wrapper so every page handles
 * loading and failure the same way instead of re-inventing it.
 */
export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean;
  error?: unknown;
  children: ReactNode;
}) {
  if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;
  if (error) {
    return <Alert type="error" showIcon message="Request failed" description={apiErrorMessage(error)} />;
  }
  return <>{children}</>;
}
