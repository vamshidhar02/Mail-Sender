import { Button, Result } from 'antd';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const status = isRouteErrorResponse(error) ? error.status : 500;
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Something went wrong';

  return (
    <Result
      status={status === 404 ? '404' : '500'}
      title={status}
      subTitle={message}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Back to dashboard
        </Button>
      }
    />
  );
}
