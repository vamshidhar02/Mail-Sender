import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ContactStatus, type Contact, type CreateContactRequest } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { ContactStatusTag } from '@/components/common/StatusTag';
import { apiErrorMessage } from '@/lib/apiError';
import {
  useCreateContactMutation,
  useDeleteContactMutation,
  useGetContactsQuery,
  useGetListsQuery,
  useUnsubscribeContactMutation,
} from '@/services/api';

export default function ContactsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateContactRequest>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [listId, setListId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const { data, isLoading, isFetching, error } = useGetContactsQuery({
    page,
    limit: 10,
    search: search || undefined,
    listId,
  });
  const lists = useGetListsQuery({ limit: 100 });
  const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
  const [unsubscribe] = useUnsubscribeContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  const run = async (action: Promise<unknown>, ok: string) => {
    try {
      await action;
      message.success(ok);
    } catch (err) {
      message.error(apiErrorMessage(err));
    }
  };

  const submit = async (values: CreateContactRequest) => {
    try {
      await createContact(values).unwrap();
      message.success('Contact added');
      setOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnsType<Contact> = [
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Name',
      key: 'name',
      render: (_, row) => [row.firstName, row.lastName].filter(Boolean).join(' ') || '--',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: ContactStatus) => <ContactStatusTag status={status} />,
    },
    { title: 'Lists', dataIndex: 'listIds', render: (ids: string[]) => ids.length },
    {
      title: 'Attributes',
      dataIndex: 'attributes',
      render: (attrs: Contact['attributes']) =>
        Object.keys(attrs).length ? JSON.stringify(attrs) : '--',
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Space>
          {row.status === ContactStatus.Subscribed && (
            <Button
              size="small"
              onClick={() => run(unsubscribe(row.id).unwrap(), 'Unsubscribed')}
            >
              Unsubscribe
            </Button>
          )}
          <Popconfirm
            title="Delete this contact?"
            onConfirm={() => run(deleteContact(row.id).unwrap(), 'Contact deleted')}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Only subscribed contacts receive campaigns."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Add contact
          </Button>
        }
      />

      <Space className="mb-4" wrap>
        <Input.Search
          allowClear
          placeholder="Search name or email"
          className="w-72"
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Filter by list"
          className="w-56"
          value={listId}
          onChange={(value) => {
            setListId(value);
            setPage(1);
          }}
          options={(lists.data?.items ?? []).map((l) => ({ value: l.id, label: l.name }))}
        />
      </Space>

      <QueryState isLoading={isLoading} error={error}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isFetching}
          pagination={{
            current: data?.page ?? 1,
            pageSize: data?.limit ?? 10,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </QueryState>

      <Modal
        title="Add contact"
        open={open}
        onOk={form.submit}
        confirmLoading={isCreating}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="person@example.com" />
          </Form.Item>
          <Form.Item name="firstName" label="First name">
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last name">
            <Input />
          </Form.Item>
          <Form.Item name="listIds" label="Lists">
            <Select
              mode="multiple"
              options={(lists.data?.items ?? []).map((l) => ({ value: l.id, label: l.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
