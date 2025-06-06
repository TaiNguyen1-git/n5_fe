import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button, message, Spin, Alert, Progress } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
  ReloadOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardService, DashboardStats, RecentBooking } from '../../../services/dashboardService';
import { discountService, DiscountStats, Discount } from '../../../services/discountService';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalBookings: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [discountStats, setDiscountStats] = useState<DiscountStats>({
    totalDiscounts: 0,
    activeDiscounts: 0,
    expiredDiscounts: 0,
    expiringSoonDiscounts: 0,
    invalidDiscounts: 0
  });
  const [expiringSoonDiscounts, setExpiringSoonDiscounts] = useState<Discount[]>([]);

  // Use useCallback to memoize the fetchDashboardData function
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchRecentBookings(), fetchDiscountData()]);
    } catch (error) {
      message.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await dashboardService.getDashboardStats();

      setStats(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch recent bookings
  const fetchRecentBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await dashboardService.getRecentBookings();

      setRecentBookings(data);
    } catch (error) {
      message.error('Không thể tải dữ liệu đặt phòng gần đây. Vui lòng thử lại sau.');
    } finally {
      setBookingsLoading(false);
    }
  };

  // Fetch discount data
  const fetchDiscountData = async () => {
    setDiscountLoading(true);
    try {
      const [stats, expiring] = await Promise.all([
        discountService.getDiscountStats(),
        discountService.getExpiringSoonDiscounts()
      ]);

      setDiscountStats(stats);
      setExpiringSoonDiscounts(expiring);
    } catch (error) {
      message.error('Không thể tải dữ liệu mã giảm giá. Vui lòng thử lại sau.');
    } finally {
      setDiscountLoading(false);
    }
  };

  // Define columns for the recent bookings table
  const columns = [
    {
      title: 'Ngày đặt',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A',
      sorter: (a: RecentBooking, b: RecentBooking) => {
        const dateA = dayjs(a.bookingDate);
        const dateB = dayjs(b.bookingDate);
        return dateB.unix() - dateA.unix(); // Sắp xếp mới nhất trước
      },
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Phòng',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Nhận phòng',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trả phòng',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = '';

        switch(status) {
          case 'confirmed':
            color = 'green';
            text = 'Đã xác nhận';
            break;
          case 'pending':
            color = 'gold';
            text = 'Chưa xác nhận';
            break;
          case 'checked_in':
            color = 'blue';
            text = 'Đã nhận phòng';
            break;
          case 'checked_out':
            color = 'cyan';
            text = 'Đã trả phòng';
            break;
          case 'cancelled':
            color = 'red';
            text = 'Đã hủy';
            break;
          default:
            text = status;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `${price.toLocaleString('vi-VN')} VNĐ`,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Tổng quan hệ thống</h2>
        <p>Thông tin tổng quan về hoạt động của khách sạn</p>
      </div>

      {loading && (
        <Alert
          message="Đang tải dữ liệu"
          description="Vui lòng đợi trong khi chúng tôi tải thông tin tổng quan."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={statsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng số phòng"
                value={stats.totalRooms}
                prefix={<HomeOutlined />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Phòng trống"
                value={stats.availableRooms}
                valueStyle={{ color: '#3f8600' }}
                prefix={<HomeOutlined />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Phòng đang sử dụng"
                value={stats.occupiedRooms}
                valueStyle={{ color: '#cf1322' }}
                prefix={<HomeOutlined />}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng đặt phòng"
                value={stats.totalBookings}
                prefix={<CalendarOutlined />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng khách hàng"
                value={stats.totalCustomers}
                prefix={<UserOutlined />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng nhân viên"
                value={stats.totalEmployees}
                prefix={<TeamOutlined />}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={stats.totalRevenue}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="VNĐ"
                formatter={(value) => `${value?.toLocaleString('vi-VN')}`}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Thống kê mã giảm giá */}
      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <Title level={4}>
          <TagOutlined style={{ marginRight: 8 }} />
          Thống kê mã giảm giá
        </Title>
      </div>

      <Spin spinning={discountLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số mã"
                value={discountStats.totalDiscounts}
                prefix={<TagOutlined />}
                loading={discountLoading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đang hoạt động"
                value={discountStats.activeDiscounts}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
                loading={discountLoading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Sắp hết hạn"
                value={discountStats.expiringSoonDiscounts}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
                loading={discountLoading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã hết hạn"
                value={discountStats.expiredDiscounts}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
                loading={discountLoading}
              />
            </Card>
          </Col>
        </Row>

        {/* Progress bar cho tỷ lệ mã hoạt động */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="Tỷ lệ mã giảm giá hoạt động">
              <Progress
                percent={discountStats.totalDiscounts > 0
                  ? Math.round((discountStats.activeDiscounts / discountStats.totalDiscounts) * 100)
                  : 0
                }
                status={discountStats.activeDiscounts > 0 ? "active" : "exception"}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={(percent) => `${percent}% (${discountStats.activeDiscounts}/${discountStats.totalDiscounts})`}
              />
            </Card>
          </Col>
        </Row>

        {/* Mã sắp hết hạn */}
        {expiringSoonDiscounts.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card
                title={
                  <span style={{ color: '#faad14' }}>
                    <WarningOutlined style={{ marginRight: 8 }} />
                    Mã giảm giá sắp hết hạn (7 ngày tới)
                  </span>
                }
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {expiringSoonDiscounts.map(discount => (
                    <Tag
                      key={discount.id}
                      color="orange"
                      style={{ marginBottom: 8 }}
                    >
                      {discount.tenMa || `Mã ${discount.id}`} -
                      Hết hạn: {dayjs(discount.ngayKetThuc).format('DD/MM/YYYY')}
                    </Tag>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>

      <div style={{ marginTop: 32 }}>
        <Title level={4}>Đặt phòng gần đây (theo thời gian đặt)</Title>
        <Table
          columns={columns}
          dataSource={recentBookings}
          rowKey="id"
          loading={bookingsLoading}
          pagination={false}
          locale={{ emptyText: 'Không có dữ liệu đặt phòng' }}
        />
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Làm mới dữ liệu
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
