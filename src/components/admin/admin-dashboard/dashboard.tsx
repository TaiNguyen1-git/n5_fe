import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  HomeOutlined, 
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    totalBookings: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalRevenue: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch statistics data
      // In a real application, you would fetch this data from your API
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set mock statistics
      setStats({
        totalRooms: 30,
        availableRooms: 15,
        occupiedRooms: 12,
        totalBookings: 45,
        totalCustomers: 120,
        totalEmployees: 25,
        totalRevenue: 45000000
      });
      
      // Set mock recent bookings
      setRecentBookings([
        {
          id: 1,
          roomNumber: '101',
          customerName: 'Nguyễn Văn A',
          checkIn: dayjs().format('YYYY-MM-DD'),
          checkOut: dayjs().add(2, 'day').format('YYYY-MM-DD'),
          status: 'confirmed',
          totalPrice: 1800000
        },
        {
          id: 2,
          roomNumber: '205',
          customerName: 'Trần Thị B',
          checkIn: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          checkOut: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          status: 'pending',
          totalPrice: 2400000
        },
        {
          id: 3,
          roomNumber: '310',
          customerName: 'Lê Văn C',
          checkIn: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
          checkOut: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          status: 'checked_in',
          totalPrice: 1600000
        },
        {
          id: 4,
          roomNumber: '402',
          customerName: 'Phạm Thị D',
          checkIn: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
          checkOut: dayjs().format('YYYY-MM-DD'),
          status: 'checked_out',
          totalPrice: 1200000
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số phòng"
              value={stats.totalRooms}
              prefix={<HomeOutlined />}
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
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng nhân viên"
              value={stats.totalEmployees}
              prefix={<TeamOutlined />}
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
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 32 }}>
        <Title level={4}>Đặt phòng gần đây</Title>
        <Table
          columns={columns}
          dataSource={recentBookings}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type="primary" onClick={fetchDashboardData}>
          Làm mới dữ liệu
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
