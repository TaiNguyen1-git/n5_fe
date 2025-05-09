import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './styles.module.css';
import { 
  UserOutlined, 
  HomeOutlined, 
  BellOutlined, 
  CalendarOutlined, 
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  CreditCardOutlined,
  SettingOutlined,
  BookOutlined
} from '@ant-design/icons';
import { Layout, Menu, Typography, Button, Avatar, Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { isAuthenticated, logout, getCurrentUser } from '../../../services/authService';
import StaffServiceManagement from '../staff-service-management';
import RoomManagement from './room-management';
import BookingManagement from './booking-management';
import CustomerManagement from './customer-management';
import BillManagement from './bill-management';
import ReportManagement from './report-management';
import SettingsManagement from './settings-management';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const StaffDashboard = () => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xác thực người dùng
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Lấy thông tin người dùng hiện tại
    const user = getCurrentUser();
    
    // Kiểm tra quyền truy cập dựa trên loaiTK và role
    const loaiTK = typeof user?.loaiTK === 'string' ? parseInt(user.loaiTK, 10) : user?.loaiTK;
    const isStaff = user?.role === 'staff' || loaiTK === 2;
    
    console.log('StaffDashboard - Thông tin người dùng:', {
      username: user?.username || (user as any)?.tenTK,
      role: user?.role,
      loaiTK: loaiTK,
      isStaff: isStaff
    });
    
    if (!isStaff) {
      console.log('StaffDashboard - Người dùng không phải nhân viên, chuyển hướng về trang chủ');
      router.push('/');
      return;
    }
    
    console.log('StaffDashboard - Xác nhận người dùng là nhân viên, cho phép truy cập');
    setUserData(user);
    setLoading(false);
  }, [router]);

  const handleMenuSelect = (key: string) => {
    setSelectedMenu(key);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <Layout className={styles.staffLayout}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className={styles.sider}
      >
        <div className={styles.logo}>
          {!collapsed && <h2>Nhóm 5 Hotel</h2>}
          {collapsed && <h2>N5</h2>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          onClick={({key}) => handleMenuSelect(key)}
          className={styles.sideMenu}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
            { key: 'rooms', icon: <HomeOutlined />, label: 'Quản lý phòng' },
            { key: 'bookings', icon: <CalendarOutlined />, label: 'Đặt phòng' },
            { key: 'customers', icon: <TeamOutlined />, label: 'Khách hàng' },
            { key: 'services', icon: <BellOutlined />, label: 'Dịch vụ' },
            { key: 'bills', icon: <CreditCardOutlined />, label: 'Hóa đơn' },
            { key: 'reports', icon: <BookOutlined />, label: 'Báo cáo' },
            { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
          ]}
        />
      </Sider>
      <Layout className={`${styles.siteLayout} ${collapsed ? styles.collapsed : ''}`}> 
        <Header className={styles.siteHeader} style={{ padding: 0 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={styles.triggerButton}
          />
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <Avatar icon={<UserOutlined />} />
              <span className={styles.userName}>{userData?.fullName || userData?.username || 'Nhân viên'}</span>
            </div>
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              type="text"
            >
              Đăng xuất
            </Button>
          </div>
        </Header>
        <Content className={styles.siteContent}>
          {selectedMenu === 'dashboard' && (
            <div className={styles.dashboard}>
              <Title level={2}>Tổng quan</Title>
              <Row gutter={16} className={styles.statsRow}>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Tổng số phòng" 
                      value={20} 
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Phòng trống" 
                      value={5} 
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Phòng đã đặt" 
                      value={10} 
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Phòng đang sử dụng" 
                      value={5} 
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
              </Row>
              <Card title="Phòng cần quản lý hôm nay" className={styles.roomsTable}>
                <Table 
                  columns={[]} 
                  dataSource={[]} 
                  pagination={false}
                  bordered
                />
              </Card>
            </div>
          )}
          {selectedMenu === 'rooms' && (
            <RoomManagement />
          )}
          {selectedMenu === 'bookings' && (
            <BookingManagement />
          )}
          {selectedMenu === 'customers' && (
            <CustomerManagement />
          )}
          {selectedMenu === 'services' && (
            <StaffServiceManagement />
          )}
          {selectedMenu === 'bills' && (
            <BillManagement />
          )}
          {selectedMenu === 'reports' && (
            <ReportManagement />
          )}
          {selectedMenu === 'settings' && (
            <SettingsManagement />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StaffDashboard;