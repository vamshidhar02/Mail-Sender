import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ContactList } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { apiErrorMessage } from '@/lib/apiError';
import { useCreateListMutation, useDeleteListMutation, useGetListsQuery } from '@/services/api';

interface ListForm {
  name: string;
  description?: string;
}

export default function ListsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<ListForm>();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isFetching, error } = useGetListsQuery({ page, limit: 10 });
  const [createList, { isLoading: isCreating }] = useCreateListMutation();
  const [deleteList] = useDeleteListMutation();

  const submit = async (values: ListForm) => {
    try {
      await createList(values).unwrap();
      message.success('List created');
      setOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(apiErrorMessage(err));
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteList(id).unwrap();
      message.success('List deleted');
    } catch (err) {
      message.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnsType<ContactList> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Description', dataIndex: 'description', render: (v?: string) => v ?? '--' },
    { title: 'Contacts', dataIndex: 'contactCount' },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Popconfirm
          title="Delete this list?"
          description="Contacts are kept; only the list and its memberships go."
          onConfirm={() => remove(row.id)}
        >
          <Button size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Lists"
        description="Group contacts so a campaign can target them."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            New list
          </Button>
        }
      />

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
        title="New list"
        open={open}
        onOk={form.submit}
        confirmLoading={isCreating}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Newsletter" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Space />
    </>
  );
}
