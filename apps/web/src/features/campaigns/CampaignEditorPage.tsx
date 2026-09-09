import { App, Button, Card, Form, Input, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { CreateCampaignRequest } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { ROUTES } from '@/app/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useCreateCampaignMutation, useGetListsQuery, useGetTemplatesQuery } from '@/services/api';

export default function CampaignEditorPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateCampaignRequest>();

  const templates = useGetTemplatesQuery({ limit: 100 });
  const lists = useGetListsQuery({ limit: 100 });
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();

  const submit = async (values: CreateCampaignRequest) => {
    try {
      const campaign = await createCampaign(values).unwrap();
      message.success('Campaign created');
      navigate(ROUTES.campaignDetail(campaign.id));
    } catch (error) {
      message.error(apiErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title="New campaign"
        description="Pick a template and the lists to send it to. Nothing sends until you press Send."
      />

      <QueryState
        isLoading={templates.isLoading || lists.isLoading}
        error={templates.error ?? lists.error}
      >
        <Card className="max-w-2xl">
          <Form
            form={form}
            layout="vertical"
            onFinish={submit}
            initialValues={{ fromName: 'Mail Sender', fromEmail: 'no-reply@localhost' }}
          >
            <Form.Item name="name" label="Campaign name" rules={[{ required: true }]}>
              <Input placeholder="March newsletter" />
            </Form.Item>

            <Form.Item name="templateId" label="Template" rules={[{ required: true }]}>
              <Select
                placeholder="Choose a template"
                options={(templates.data?.items ?? []).map((t) => ({
                  value: t.id,
                  label: t.name + ' -- ' + t.subject,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="listIds"
              label="Lists"
              rules={[{ required: true, message: 'Pick at least one list' }]}
            >
              <Select
                mode="multiple"
                placeholder="Choose one or more lists"
                options={(lists.data?.items ?? []).map((l) => ({
                  value: l.id,
                  label: l.name + ' (' + l.contactCount + ')',
                }))}
              />
            </Form.Item>

            <Space.Compact block>
              <Form.Item name="fromName" label="From name" rules={[{ required: true }]} className="w-1/2">
                <Input />
              </Form.Item>
              <Form.Item
                name="fromEmail"
                label="From email"
                rules={[{ required: true, type: 'email' }]}
                className="w-1/2"
              >
                <Input />
              </Form.Item>
            </Space.Compact>

            <Form.Item name="replyTo" label="Reply-to" rules={[{ type: 'email' }]}>
              <Input placeholder="Optional" />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                Create campaign
              </Button>
              <Button onClick={() => navigate(ROUTES.campaigns)}>Cancel</Button>
            </Space>
          </Form>
        </Card>
      </QueryState>
    </>
  );
}
