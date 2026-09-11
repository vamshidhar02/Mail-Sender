import { GoogleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Typography } from 'antd';
import { Navigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { ROUTES } from '@/app/routes';
import { GOOGLE_SIGN_IN_URL } from '@/lib/apiBase';
import { errorDismissed, selectAuthError, selectIsAuthenticated } from './authSlice';

const { Title, Paragraph } = Typography;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const error = useAppSelector(selectAuthError);

  // Already signed in - nothing to do here. Covers the back button after a
  // successful sign-in as well as a direct visit to /login.
  if (isAuthenticated) return <Navigate to={ROUTES.dashboard} replace />;

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-sm shadow-sm">
        <Title level={3} className="!mb-1">
          Mail Sender
        </Title>
        <Paragraph type="secondary" className="!mb-6">
          Sign in to manage contacts, templates and campaigns.
        </Paragraph>

        {error && (
          <Alert
            type="error"
            showIcon
            closable
            className="mb-4"
            message={error}
            onClose={() => dispatch(errorDismissed())}
          />
        )}

        <Button
          type="primary"
          size="large"
          block
          icon={<GoogleOutlined />}
          // A plain anchor, not a fetch: /auth/google answers with a 302 to
          // Google's consent screen, which only a real navigation can follow.
          href={GOOGLE_SIGN_IN_URL}
        >
          Continue with Google
        </Button>
      </Card>
    </div>
  );
}
