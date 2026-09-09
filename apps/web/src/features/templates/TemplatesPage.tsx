import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate } from 'react-router-dom';
import type { Template } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { ROUTES } from '@/app/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useDeleteTemplateMutation, useGetTemplatesQuery } from '@/services/api';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, error } = useGetTemplatesQuery({ page, limit: 10 });
  const [deleteTemplate] = useDeleteTemplateMutation();

  const remove = async (id: string) => {
    try {
      await deleteTemplate(id).unwrap();
      message.success('Template deleted');
    } catch (err) {
      message.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnsType<Template> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, row) => <Link to={ROUTES.templateDetail(row.id)}>{name}</Link>,
    },
    { title: 'Subject', dataIndex: 'subject' },
    {
      title: 'Merge tags',
      dataIndex: 'variables',
      render: (variables: string[]) =>
        variables.length ? (
          <Space size={[0, 4]} wrap>
            {variables.map((v) => (
              <Tag key={v}>{v}</Tag>
            ))}
          </Space>
        ) : (
          '--'
        ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => navigate(ROUTES.templateDetail(row.id))}>
            Edit
          </Button>
          <Popconfirm title="Delete this template?" onConfirm={() => remove(row.id)}>
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
        title="Templates"
        description="Bodies support {{firstName}}, {{lastName}}, {{email}} and {{attributes.anything}}."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(ROUTES.templateNew)}>
            New template
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
    </>
  );
}
