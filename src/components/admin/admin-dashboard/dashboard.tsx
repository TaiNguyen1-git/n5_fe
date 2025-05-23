import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button, message, Spin, Alert } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardService, DashboardStats, RecentBooking } from '../../../services/dashboardService';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
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

  // Use useCallback to memoize the fetchDashboardData function
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchRecentBookings()]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
      console.log('Dashboard stats:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
      console.log('Recent bookings:', data);
      setRecentBookings(data);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      message.error('Không thể tải dữ liệu đặt phòng gần đây. Vui lòng thử lại sau.');
    } finally {
      setBookingsLoading(false);
    }
  };

  // Define columns for the recent bookings table
  const columns = [
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

      <div style={{ marginTop: 32 }}>
        <Title level={4}>Đặt phòng gần đây</Title>
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
