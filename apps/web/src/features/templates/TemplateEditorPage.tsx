import { useEffect } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Col, Form, Input, Row, Space, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import type { CreateTemplateRequest } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { ROUTES } from '@/app/routes';
import { apiErrorMessage } from '@/lib/apiError';
import {
  useCreateTemplateMutation,
  useGetTemplateQuery,
  usePreviewTemplateMutation,
  useUpdateTemplateMutation,
} from '@/services/api';

export default function TemplateEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateTemplateRequest>();

  const existing = useGetTemplateQuery(id ?? '', { skip: isNew });
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();
  const [preview, { data: previewData, isLoading: isPreviewing }] = usePreviewTemplateMutation();

  // Populate the form once the template arrives. `text` is nullable on the wire
  // but the form only deals in strings, so normalise it here.
  useEffect(() => {
    if (!existing.data) return;
    const { name, subject, html, text } = existing.data;
    form.setFieldsValue({ name, subject, html, text: text ?? undefined });
  }, [existing.data, form]);

  const submit = async (values: CreateTemplateRequest) => {
    try {
      if (isNew) {
        const created = await createTemplate(values).unwrap();
        message.success('Template created');
        navigate(ROUTES.templateDetail(created.id));
      } else {
        await updateTemplate({ id: id as string, body: values }).unwrap();
        message.success('Template saved');
      }
    } catch (error) {
      message.error(apiErrorMessage(error));
    }
  };

  const runPreview = async () => {
    if (isNew) {
      message.info('Save the template first, then preview it.');
      return;
    }
    try {
      await preview({ id: id as string, body: {} }).unwrap();
    } catch (error) {
      message.error(apiErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title={isNew ? 'New template' : 'Edit template'}
        description="Merge tags are detected when you save."
        extra={
          <Space>
            <Button icon={<EyeOutlined />} onClick={runPreview} loading={isPreviewing}>
              Preview
            </Button>
            <Button onClick={() => navigate(ROUTES.templates)}>Back</Button>
          </Space>
        }
      />

      <QueryState isLoading={!isNew && existing.isLoading} error={existing.error}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={previewData ? 12 : 24}>
            <Card>
              <Form form={form} layout="vertical" onFinish={submit}>
                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                  <Input placeholder="Welcome" />
                </Form.Item>
                <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
                  <Input placeholder="Welcome aboard, {{firstName}}!" />
                </Form.Item>
                <Form.Item name="html" label="HTML body" rules={[{ required: true }]}>
                  <Input.TextArea rows={12} className="font-mono" />
                </Form.Item>
                <Form.Item name="text" label="Plain text (optional)">
                  <Input.TextArea rows={4} className="font-mono" />
                </Form.Item>

                {existing.data?.variables?.length ? (
                  <div className="mb-4">
                    <span className="mr-2 text-slate-500">Detected merge tags:</span>
                    {existing.data.variables.map((v) => (
                      <Tag key={v}>{v}</Tag>
                    ))}
                  </div>
                ) : null}

                <Button type="primary" htmlType="submit" loading={isCreating || isUpdating}>
                  {isNew ? 'Create template' : 'Save changes'}
                </Button>
              </Form>
            </Card>
          </Col>

          {previewData && (
            <Col xs={24} lg={12}>
              <Card title="Preview" extra={<Tag>sample data</Tag>}>
                <p className="mb-2">
                  <strong>Subject:</strong> {previewData.subject}
                </p>
                {previewData.missingVariables.length > 0 && (
                  <Alert
                    className="mb-3"
                    type="warning"
                    showIcon
                    message="Unresolved merge tags"
                    description={previewData.missingVariables.join(', ')}
                  />
                )}
                <div
                  className="rounded border border-slate-200 p-3"
                  // Preview content is authored by the operator, not a visitor.
                  dangerouslySetInnerHTML={{ __html: previewData.html }}
                />
              </Card>
            </Col>
          )}
        </Row>
      </QueryState>
    </>
  );
}
