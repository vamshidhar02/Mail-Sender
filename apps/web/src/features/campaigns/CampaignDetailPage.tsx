import { useState } from 'react';
import { SendOutlined, ExperimentOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Descriptions, Modal, Popconfirm, Row, Space, Statistic } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { CampaignStatus } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { CampaignStatusTag } from '@/components/common/StatusTag';
import { ROUTES } from '@/app/routes';
import { apiErrorMessage } from '@/lib/apiError';
import {
  useGetCampaignQuery,
  useGetCampaignStatsQuery,
  useSendCampaignMutation,
  useSendTestMutation,
} from '@/services/api';

export default function CampaignDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [testEmail, setTestEmail] = useState('');
  const [testOpen, setTestOpen] = useState(false);

  const campaign = useGetCampaignQuery(id, { skip: !id });
  const stats = useGetCampaignStatsQuery(id, { skip: !id });
  const [sendCampaign, { isLoading: isSending }] = useSendCampaignMutation();
  const [sendTest, { isLoading: isTesting }] = useSendTestMutation();

  const send = async () => {
    try {
      const result = await sendCampaign(id).unwrap();
      modal.success({
        title: 'Campaign sent',
        content:
          result.sent + ' of ' + result.recipients + ' delivered, ' + result.failed + ' failed.',
      });
    } catch (error) {
      message.error(apiErrorMessage(error));
    }
  };

  const runTest = async () => {
    try {
      await sendTest({ id, body: { emails: [testEmail] } }).unwrap();
      message.success('Test sent to ' + testEmail);
      setTestOpen(false);
    } catch (error) {
      message.error(apiErrorMessage(error));
    }
  };

  const isDraft = campaign.data?.status === CampaignStatus.Draft;

  return (
    <>
      <PageHeader
        title={campaign.data?.name ?? 'Campaign'}
        description="Sending walks every subscribed contact on the selected lists."
        extra={
          <Space>
            <Button icon={<ExperimentOutlined />} onClick={() => setTestOpen(true)}>
              Send test
            </Button>
            <Popconfirm
              title="Send this campaign?"
              description="This mails every subscribed contact on its lists."
              okText="Send"
              onConfirm={send}
              disabled={!isDraft}
            >
              <Button type="primary" icon={<SendOutlined />} loading={isSending} disabled={!isDraft}>
                Send
              </Button>
            </Popconfirm>
            <Button onClick={() => navigate(ROUTES.campaigns)}>Back</Button>
          </Space>
        }
      />

      <QueryState isLoading={campaign.isLoading} error={campaign.error}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="Recipients" value={stats.data?.recipients ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="Sent" value={stats.data?.sent ?? 0} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="Failed" value={stats.data?.failed ?? 0} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic title="Pending" value={stats.data?.pending ?? 0} />
            </Card>
          </Col>
        </Row>

        <Card className="mt-4">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Status">
              {campaign.data && <CampaignStatusTag status={campaign.data.status} />}
            </Descriptions.Item>
            <Descriptions.Item label="Template">
              {campaign.data?.templateName ?? '--'}
            </Descriptions.Item>
            <Descriptions.Item label="From">
              {campaign.data?.fromName} &lt;{campaign.data?.fromEmail}&gt;
            </Descriptions.Item>
            <Descriptions.Item label="Reply-to">{campaign.data?.replyTo ?? '--'}</Descriptions.Item>
            <Descriptions.Item label="Lists">{campaign.data?.listIds.length ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Completed">
              {campaign.data?.completedAt
                ? new Date(campaign.data.completedAt).toLocaleString()
                : '--'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </QueryState>

      <Modal
        title="Send a test"
        open={testOpen}
        onOk={runTest}
        confirmLoading={isTesting}
        okButtonProps={{ disabled: !testEmail }}
        onCancel={() => setTestOpen(false)}
      >
        <p className="mb-2">A test does not write message rows or affect stats.</p>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="you@example.com"
          value={testEmail}
          onChange={(event) => setTestEmail(event.target.value)}
        />
      </Modal>
    </>
  );
}
