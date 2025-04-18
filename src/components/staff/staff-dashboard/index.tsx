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

  // Mock data cho bảng phòng cần quản lý
  const roomsData = [
    {
      key: '1',
      soPhong: '101',
      loaiPhong: 'Phòng Đơn',
      trangThai: 'Đã đặt',
      ngayNhan: '15/08/2023',
      ngayTra: '18/08/2023',
      tenKhach: 'Nguyễn Văn A'
    },
    {
      key: '2',
      soPhong: '102',
      loaiPhong: 'Phòng Đôi',
      trangThai: 'Trống',
      ngayNhan: '',
      ngayTra: '',
      tenKhach: ''
    },
    {
      key: '3',
      soPhong: '201',
      loaiPhong: 'Phòng VIP',
      trangThai: 'Đang sử dụng',
      ngayNhan: '16/08/2023',
      ngayTra: '20/08/2023',
      tenKhach: 'Trần Thị B'
    },
    {
      key: '4',
      soPhong: '202',
      loaiPhong: 'Phòng Gia đình',
      trangThai: 'Đang dọn dẹp',
      ngayNhan: '',
      ngayTra: '',
      tenKhach: ''
    },
  ];

  // Columns cho bảng phòng
  const roomColumns = [
    {
      title: 'Số Phòng',
      dataIndex: 'soPhong',
      key: 'soPhong',
    },
    {
      title: 'Loại Phòng',
      dataIndex: 'loaiPhong',
      key: 'loaiPhong',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (text: string) => {
        let color = 'green';
        if (text === 'Đã đặt') color = 'blue';
        else if (text === 'Đang sử dụng') color = 'orange';
        else if (text === 'Đang dọn dẹp') color = 'purple';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Tên Khách',
      dataIndex: 'tenKhach',
      key: 'tenKhach',
    },
    {
      title: 'Ngày Nhận',
      dataIndex: 'ngayNhan',
      key: 'ngayNhan',
    },
    {
      title: 'Ngày Trả',
      dataIndex: 'ngayTra',
      key: 'ngayTra',
    },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="primary" size="small">
          Chi tiết
        </Button>
      ),
    },
  ];

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
          className={styles.sideMenu}
          onClick={({key}) => handleMenuSelect(key)}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: 'Tổng quan',
            },
            {
              key: 'rooms',
              icon: <HomeOutlined />,
              label: 'Quản lý phòng',
            },
            {
              key: 'bookings',
              icon: <CalendarOutlined />,
              label: 'Đặt phòng',
            },
            {
              key: 'customers',
              icon: <TeamOutlined />,
              label: 'Khách hàng',
            },
            {
              key: 'services',
              icon: <BellOutlined />,
              label: 'Dịch vụ',
            },
            {
              key: 'bills',
              icon: <CreditCardOutlined />,
              label: 'Hóa đơn',
            },
            {
              key: 'reports',
              icon: <BookOutlined />,
              label: 'Báo cáo',
            },
            {
              key: 'settings',
              icon: <SettingOutlined />,
              label: 'Cài đặt',
            },
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
                  columns={roomColumns} 
                  dataSource={roomsData} 
                  pagination={false}
                  bordered
                />
              </Card>
            </div>
          )}

          {selectedMenu === 'rooms' && (
            <div>
              <Title level={2}>Quản lý phòng</Title>
              <Card>
                <Text>Tính năng đang phát triển</Text>
              </Card>
            </div>
          )}

          {selectedMenu === 'bookings' && (
            <div>
              <Title level={2}>Đặt phòng</Title>
              <Card>
                <Text>Tính năng đang phát triển</Text>
              </Card>
            </div>
          )}

          {selectedMenu === 'customers' && (
            <div>
              <Title level={2}>Quản lý khách hàng</Title>
              <Card>
                <Text>Tính năng đang phát triển</Text>
              </Card>
            </div>
          )}

          {selectedMenu === 'services' && (
            <StaffServiceManagement />
          )}

          {selectedMenu === 'bills' && (
            <div>
              <Title level={2}>Quản lý hóa đơn</Title>
              <Card>
                <Text>Tính năng đang phát triển</Text>
              </Card>
            </div>
          )}

          {selectedMenu === 'reports' && (
            <div>
              <Title level={2}>Báo cáo</Title>
              <Card>
                <Text>Tính năng đang phát triển</Text>
              </Card>
            </div>
          )}

          {selectedMenu === 'settings' && (
            <div>
              <Title level={2}>Cài đặt</Title>
              <Card>
                <Text>Tính năng đang phát triển</Text>
              </Card>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default StaffDashboard; 