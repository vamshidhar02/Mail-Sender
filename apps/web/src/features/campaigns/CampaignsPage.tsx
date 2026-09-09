import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Input, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate } from 'react-router-dom';
import { CampaignStatus, type Campaign } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { CampaignStatusTag } from '@/components/common/StatusTag';
import { ROUTES } from '@/app/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useDeleteCampaignMutation, useGetCampaignsQuery } from '@/services/api';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, error } = useGetCampaignsQuery({
    page,
    limit: 10,
    search: search || undefined,
  });
  const [deleteCampaign, { isLoading: isDeleting }] = useDeleteCampaignMutation();

  const remove = async (id: string) => {
    try {
      await deleteCampaign(id).unwrap();
      message.success('Campaign deleted');
    } catch (err) {
      message.error(apiErrorMessage(err));
    }
  };

  const columns: ColumnsType<Campaign> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, row) => <Link to={ROUTES.campaignDetail(row.id)}>{name}</Link>,
    },
    { title: 'Template', dataIndex: 'templateName', render: (v?: string) => v ?? '--' },
    { title: 'Lists', dataIndex: 'listIds', render: (ids: string[]) => ids.length },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: CampaignStatus) => <CampaignStatusTag status={status} />,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => navigate(ROUTES.campaignDetail(row.id))}>
            Open
          </Button>
          {/* Only drafts are deletable; the API enforces this too. */}
          {row.status === CampaignStatus.Draft && (
            <Popconfirm title="Delete this campaign?" onConfirm={() => remove(row.id)}>
              <Button size="small" danger loading={isDeleting}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Each campaign sends one template to one or more lists."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(ROUTES.campaignNew)}>
            New campaign
          </Button>
        }
      />

      <Input.Search
        allowClear
        placeholder="Search by name"
        className="mb-4 max-w-sm"
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
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
