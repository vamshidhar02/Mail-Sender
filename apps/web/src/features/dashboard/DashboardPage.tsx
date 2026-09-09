import { Card, Col, Empty, List, Row, Statistic, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { CampaignStatus, ContactStatus } from '@mailer/shared';

import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { CampaignStatusTag } from '@/components/common/StatusTag';
import { ROUTES } from '@/app/routes';
import { useGetCampaignsQuery, useGetContactsQuery, useGetListsQuery } from '@/services/api';

export default function DashboardPage() {
  // limit: 1 keeps these cheap - only the `total` is needed for the tiles.
  const subscribed = useGetContactsQuery({ limit: 1, status: ContactStatus.Subscribed });
  const unsubscribed = useGetContactsQuery({ limit: 1, status: ContactStatus.Unsubscribed });
  const lists = useGetListsQuery({ limit: 1 });
  const recent = useGetCampaignsQuery({ limit: 5 });

  const isLoading =
    subscribed.isLoading || unsubscribed.isLoading || lists.isLoading || recent.isLoading;
  const error = subscribed.error ?? unsubscribed.error ?? lists.error ?? recent.error;

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your lists and recent sends." />

      <QueryState isLoading={isLoading} error={error}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Subscribed contacts" value={subscribed.data?.total ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Unsubscribed" value={unsubscribed.data?.total ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Lists" value={lists.data?.total ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Campaigns" value={recent.data?.total ?? 0} />
            </Card>
          </Col>
        </Row>

        <Card className="mt-4" title="Recent campaigns">
          {recent.data?.items.length ? (
            <List
              dataSource={recent.data.items}
              renderItem={(campaign) => (
                <List.Item
                  actions={[<CampaignStatusTag key="status" status={campaign.status} />]}
                >
                  <List.Item.Meta
                    title={
                      <Link to={ROUTES.campaignDetail(campaign.id)}>{campaign.name}</Link>
                    }
                    description={
                      <Typography.Text type="secondary">
                        {campaign.templateName ?? 'No template'} ..{' '}
                        {campaign.listIds.length} list(s)
                      </Typography.Text>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No campaigns yet">
              <Link to={ROUTES.campaignNew}>Create one</Link>
            </Empty>
          )}
        </Card>

        {recent.data?.items.some((c) => c.status === CampaignStatus.Draft) && (
          <Typography.Paragraph type="secondary" className="mt-4">
            Drafts are editable; once a campaign is sent it becomes read-only.
          </Typography.Paragraph>
        )}
      </QueryState>
    </>
  );
}
