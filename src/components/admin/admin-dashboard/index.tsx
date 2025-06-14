import React, { useState, useEffect, Suspense } from 'react';
import { Layout, Menu, Typography, Button, Avatar, Card, Row, Col, Table, Tag, Space, Modal, message, Spin } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ScheduleOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  SettingOutlined,
  HomeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BellOutlined,
  SearchOutlined,
  BarChartOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { logout, getCurrentUser } from '../../../services/authService';
import StaffManagement from './staff-management';
import UserManagement from './user-management';
import WorkShiftManagement from './work-shift-management';
import RoomManagement from './room-management';
import BillManagement from './bill-management';
import BookingManagement from './booking-management';
import EmployeeManagement from './employee-management';
import ServiceManagement from './service-management';
import ServiceUsageManagement from './service-usage-management';
import DiscountManagement from './discount-management';
import Dashboard from './dashboard';
import RoomStatusDashboard from '../../shared/RoomStatusDashboard';
import CustomerAnalyticsDashboard from '../../shared/CustomerAnalyticsDashboard';
import AdvancedSearchDashboard from '../../shared/AdvancedSearchDashboard';
import RevenueReportExport from '../../shared/RevenueReportExport';
import NotificationBell from '../../shared/NotificationBell';
import NotificationPanel from '../../shared/NotificationPanel';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminDashboard = () => {
  const [tab, setTab] = useState<'dashboard' | 'staff' | 'user' | 'workshift' | 'room' | 'bill' | 'booking' | 'employee' | 'service' | 'service-usage' | 'discount' | 'room-status' | 'customer-analytics' | 'advanced-search' | 'revenue-report' | 'notifications'>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Lấy thông tin người dùng hiện tại
    const user = getCurrentUser();
    setUserData(user);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? 'Admin' : 'Trang quản trị Admin'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[tab]}
          onClick={({ key }) => setTab(key as any)}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: 'Tổng quan',
            },
            {
              key: 'employee',
              icon: <TeamOutlined />,
              label: 'Quản lý nhân viên',
            },
            {
              key: 'user',
              icon: <UserOutlined />,
              label: 'Quản lý người dùng',
            },
            {
              key: 'room',
              icon: <HomeOutlined />,
              label: 'Quản lý phòng',
            },
            {
              key: 'room-status',
              icon: <DashboardOutlined />,
              label: 'Dashboard trạng thái phòng',
            },
            {
              key: 'customer-analytics',
              icon: <TeamOutlined />,
              label: 'Phân tích khách hàng',
            },
            {
              key: 'advanced-search',
              icon: <SearchOutlined />,
              label: 'Tìm kiếm nâng cao',
            },
            {
              key: 'revenue-report',
              icon: <BarChartOutlined />,
              label: 'Báo cáo doanh thu',
            },
            {
              key: 'notifications',
              icon: <BellOutlined />,
              label: 'Thông báo',
            },
            {
              key: 'booking',
              icon: <CalendarOutlined />,
              label: 'Quản lý đặt phòng',
            },
            {
              key: 'bill',
              icon: <FileTextOutlined />,
              label: 'Quản lý hóa đơn',
            },
            {
              key: 'discount',
              icon: <TagOutlined />,
              label: 'Quản lý mã giảm giá',
            },
            {
              key: 'workshift',
              icon: <ScheduleOutlined />,
              label: 'Quản lý ca làm',
            },
            {
              key: 'service',
              icon: <BellOutlined />,
              label: 'Quản lý dịch vụ',
            },
            {
              key: 'service-usage',
              icon: <SettingOutlined />,
              label: 'Quản lý sử dụng dịch vụ',
            },

            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Đăng xuất',
              onClick: handleLogout,
            },
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: '#fff', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <span style={{ float: 'right', marginRight: 24 }}>
            <Space>
              <NotificationBell />
              <Avatar icon={<UserOutlined />} />
              <span>{userData?.fullName || 'Admin'}</span>
            </Space>
          </span>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 4 }}>
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Đang tải..." /></div>}>
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'employee' && <EmployeeManagement />}
            {tab === 'staff' && <StaffManagement />}
            {tab === 'user' && <UserManagement />}
            {tab === 'room' && <RoomManagement />}
            {tab === 'room-status' && <RoomStatusDashboard />}
            {tab === 'customer-analytics' && <CustomerAnalyticsDashboard />}
            {tab === 'advanced-search' && <AdvancedSearchDashboard />}
            {tab === 'revenue-report' && <RevenueReportExport />}
            {tab === 'notifications' && <NotificationPanel />}
            {tab === 'booking' && <BookingManagement />}
            {tab === 'bill' && <BillManagement />}
            {tab === 'discount' && <DiscountManagement />}
            {tab === 'workshift' && <WorkShiftManagement />}
            {tab === 'service' && <ServiceManagement />}
            {tab === 'service-usage' && <ServiceUsageManagement />}
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
