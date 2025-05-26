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
  BookOutlined,
  ReloadOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Layout, Menu, Typography, Button, Avatar, Card, Row, Col, Statistic, Table, Tag, Spin, message } from 'antd';
import { isAuthenticated, logout, getCurrentUser } from '../../../services/authService';
import RoomManagement from './room-management';
import BookingManagement from './booking-management';
import CustomerManagement from './customer-management';
import BillManagement from './bill-management';
import ReportManagement from './report-management';
import SettingsManagement from './settings-management';
import RevenueCharts from '../../shared/RevenueCharts';
import RoomStatusDashboard from '../../shared/RoomStatusDashboard';
import CustomerAnalyticsDashboard from '../../shared/CustomerAnalyticsDashboard';
import AdvancedSearchDashboard from '../../shared/AdvancedSearchDashboard';
import NotificationBell from '../../shared/NotificationBell';
import NotificationPanel from '../../shared/NotificationPanel';

import ServiceManagement from './service-management';
import { dashboardService } from '../../../services/dashboardService';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// Define interfaces for dashboard data
interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  bookedRooms: number;
  totalBookings: number;
  totalCustomers: number;
  totalEmployees: number;
  totalRevenue: number;
}

interface RoomAttention {
  key: string;
  roomNumber: string;
  customerName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  action: string;
}

const StaffDashboard = () => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    bookedRooms: 0,
    totalBookings: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalRevenue: 0
  });
  const [roomsNeedAttention, setRoomsNeedAttention] = useState<RoomAttention[]>([]);

  useEffect(() => {
    // Kiểm tra xác thực người dùng
    if (!isAuthenticated()) {
      router.push('/login.js');
      return;
    }

    // Lấy thông tin người dùng hiện tại
    const user = getCurrentUser();

    // Kiểm tra quyền truy cập dựa trên loaiTK và role
    const loaiTK = typeof user?.loaiTK === 'string' ? parseInt(user.loaiTK, 10) : user?.loaiTK;
    const isStaff = user?.role === 'staff' || loaiTK === 2;
    if (!isStaff) {
      router.push('/');
      return;
    }
    setUserData(user);

    setLoading(false);

    // Fetch dashboard data
    fetchDashboardData();
  }, [router]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRoomsNeedAttention()
      ]);
    } catch (error) {
      message.error('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.');
    }
  };

  // Fetch dashboard statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      // Try to get data from the dashboard service
      try {
        const response = await dashboardService.getDashboardStats();


        // Calculate booked rooms (rooms that are reserved but not yet occupied)
        const bookedRooms = response.totalBookings - response.occupiedRooms;

        setStats({
          ...response,
          bookedRooms: bookedRooms > 0 ? bookedRooms : 0
        });
        return; // Exit if successful
      } catch (serviceError) {
        // Continue to direct API calls if service fails
      }

      // If dashboard service fails, try to fetch data directly from APIs

      // Fetch rooms data
      const roomsResponse = await fetch('/api/Phong/GetAll');
      let rooms = [];
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        if (Array.isArray(roomsData)) {
          rooms = roomsData;
        } else if (roomsData.items && Array.isArray(roomsData.items)) {
          rooms = roomsData.items;
        }
      }

      // Fetch bookings data
      const bookingsResponse = await fetch('/api/DatPhong/GetAll');
      let bookings = [];
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        if (Array.isArray(bookingsData)) {
          bookings = bookingsData;
        } else if (bookingsData.items && Array.isArray(bookingsData.items)) {
          bookings = bookingsData.items;
        }
      }

      // Calculate statistics
      const totalRooms = rooms.length;
      const availableRooms = rooms.filter((room: any) =>
        room.maTT === 1 ||
        room.trangThai === 1 ||
        (room.trangThaiPhong && room.trangThaiPhong.tenTT === 'Trống')
      ).length;

      const occupiedRooms = rooms.filter((room: any) =>
        room.maTT === 2 ||
        room.trangThai === 2 ||
        (room.trangThaiPhong && room.trangThaiPhong.tenTT === 'Đang sử dụng')
      ).length;

      const totalBookings = bookings.length;
      const bookedRooms = totalBookings - occupiedRooms > 0 ? totalBookings - occupiedRooms : 0;

      setStats({
        totalRooms,
        availableRooms,
        occupiedRooms,
        bookedRooms,
        totalBookings,
        totalCustomers: 0, // Not needed for staff dashboard
        totalEmployees: 0, // Not needed for staff dashboard
        totalRevenue: 0 // Not needed for staff dashboard
      });

    } catch (error) {
      message.error('Không thể tải dữ liệu thống kê. Hiển thị dữ liệu mẫu.');

      // Use mock data as fallback
      setStats({
        totalRooms: 20,
        availableRooms: 8,
        occupiedRooms: 7,
        bookedRooms: 5,
        totalBookings: 12,
        totalCustomers: 0,
        totalEmployees: 0,
        totalRevenue: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch rooms that need attention today (check-ins and check-outs)
  const fetchRoomsNeedAttention = async () => {
    setRoomsLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = dayjs().format('YYYY-MM-DD');
      let bookings = [];

      // Try multiple API endpoints to get bookings
      const apiEndpoints = [
        '/api/DatPhong/GetAll',
        'https://ptud-web-1.onrender.com/api/DatPhong/GetAll',
        '/api/bookings'
      ];

      let fetchSuccess = false;

      // Try each endpoint until one succeeds
      for (const endpoint of apiEndpoints) {
        try {

          const response = await fetch(endpoint);

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              bookings = data;
              fetchSuccess = true;
              break;
            } else if (data.items && Array.isArray(data.items)) {
              bookings = data.items;
              fetchSuccess = true;
              break;
            } else if (data.data && Array.isArray(data.data)) {
              bookings = data.data;
              fetchSuccess = true;
              break;
            }
          }
        } catch (endpointError) {
          // Continue to next endpoint
        }
      }

      if (!fetchSuccess) {
        // Use mock data as fallback
        bookings = [
          {
            maDatPhong: 1,
            maPhong: 101,
            tenKH: 'Nguyễn Văn A',
            ngayBatDau: dayjs().format('YYYY-MM-DD'),
            ngayKetThuc: dayjs().add(2, 'day').format('YYYY-MM-DD')
          },
          {
            maDatPhong: 2,
            maPhong: 102,
            tenKH: 'Trần Thị B',
            ngayBatDau: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
            ngayKetThuc: dayjs().format('YYYY-MM-DD')
          }
        ];
        message.warning('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
      }

      // Filter bookings for today's check-ins and check-outs
      const todayBookings = bookings.filter((booking: any) => {
        const checkInDate = dayjs(booking.ngayBatDau).format('YYYY-MM-DD');
        const checkOutDate = dayjs(booking.ngayKetThuc).format('YYYY-MM-DD');
        return checkInDate === today || checkOutDate === today;
      });
      // Format data for table
      const roomsData = todayBookings.map((booking: any, index: number) => {
        const checkInDate = dayjs(booking.ngayBatDau).format('YYYY-MM-DD');
        const isCheckIn = checkInDate === today;

        return {
          key: index.toString(),
          roomNumber: booking.maPhong || booking.phong?.soPhong || 'N/A',
          customerName: booking.tenKH || booking.khachHang?.tenKH || 'Khách hàng',
          checkInDate: dayjs(booking.ngayBatDau).format('DD/MM/YYYY'),
          checkOutDate: dayjs(booking.ngayKetThuc).format('DD/MM/YYYY'),
          status: isCheckIn ? 'Nhận phòng' : 'Trả phòng',
          action: isCheckIn ? 'Xác nhận nhận phòng' : 'Xác nhận trả phòng'
        };
      });

      setRoomsNeedAttention(roomsData);
    } catch (error) {
      message.error('Không thể tải dữ liệu phòng cần quản lý. Hiển thị dữ liệu mẫu.');

      // Use mock data as fallback
      const mockRoomsData = [
        {
          key: '1',
          roomNumber: '101',
          customerName: 'Nguyễn Văn A',
          checkInDate: dayjs().format('DD/MM/YYYY'),
          checkOutDate: dayjs().add(2, 'day').format('DD/MM/YYYY'),
          status: 'Nhận phòng',
          action: 'Xác nhận nhận phòng'
        },
        {
          key: '2',
          roomNumber: '102',
          customerName: 'Trần Thị B',
          checkInDate: dayjs().subtract(2, 'day').format('DD/MM/YYYY'),
          checkOutDate: dayjs().format('DD/MM/YYYY'),
          status: 'Trả phòng',
          action: 'Xác nhận trả phòng'
        }
      ];

      setRoomsNeedAttention(mockRoomsData);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleMenuSelect = (key: string) => {
    setSelectedMenu(key);
  };

  const handleLogout = () => {
    // Call the logout function and redirect to login page
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
          onClick={({key}) => {
            if (key === 'logout') {
              // Handle logout directly here
              handleLogout();
            } else {
              // Handle other menu items
              handleMenuSelect(key);
            }
          }}
          className={styles.sideMenu}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
            { key: 'rooms', icon: <HomeOutlined />, label: 'Quản lý phòng' },
            { key: 'room-status', icon: <DashboardOutlined />, label: 'Dashboard trạng thái phòng' },
            { key: 'customer-analytics', icon: <TeamOutlined />, label: 'Phân tích khách hàng' },
            { key: 'advanced-search', icon: <SearchOutlined />, label: 'Tìm kiếm nâng cao' },
            { key: 'notifications', icon: <BellOutlined />, label: 'Thông báo' },
            { key: 'bookings', icon: <CalendarOutlined />, label: 'Đặt phòng' },
            { key: 'customers', icon: <TeamOutlined />, label: 'Khách hàng' },
            { key: 'services', icon: <BellOutlined />, label: 'Dịch vụ' },
            { key: 'bills', icon: <CreditCardOutlined />, label: 'Hóa đơn' },
            { key: 'revenue', icon: <DollarOutlined />, label: 'Doanh thu' },
            { key: 'shifts', icon: <ClockCircleOutlined />, label: 'Ca làm việc' },
            { key: 'reports', icon: <BookOutlined />, label: 'Báo cáo' },
            { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất' },
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
              <NotificationBell size="small" />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2}>Tổng quan</Title>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchDashboardData}
                  loading={statsLoading || roomsLoading}
                >
                  Làm mới dữ liệu
                </Button>
              </div>

              <Spin spinning={statsLoading}>
                <Row gutter={16} className={styles.statsRow}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Tổng số phòng"
                        value={stats.totalRooms}
                        valueStyle={{ color: '#3f8600' }}
                        loading={statsLoading}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Phòng trống"
                        value={stats.availableRooms}
                        valueStyle={{ color: '#1890ff' }}
                        loading={statsLoading}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Phòng đã đặt"
                        value={stats.bookedRooms}
                        valueStyle={{ color: '#faad14' }}
                        loading={statsLoading}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Phòng đang sử dụng"
                        value={stats.occupiedRooms}
                        valueStyle={{ color: '#cf1322' }}
                        loading={statsLoading}
                      />
                    </Card>
                  </Col>
                </Row>
              </Spin>

              <Card
                title="Phòng cần quản lý hôm nay"
                className={styles.roomsTable}
                extra={<span>{dayjs().format('DD/MM/YYYY')}</span>}
              >
                <Spin spinning={roomsLoading}>
                  <Table
                    columns={[
                      {
                        title: 'Số phòng',
                        dataIndex: 'roomNumber',
                        key: 'roomNumber',
                      },
                      {
                        title: 'Khách hàng',
                        dataIndex: 'customerName',
                        key: 'customerName',
                      },
                      {
                        title: 'Ngày nhận phòng',
                        dataIndex: 'checkInDate',
                        key: 'checkInDate',
                      },
                      {
                        title: 'Ngày trả phòng',
                        dataIndex: 'checkOutDate',
                        key: 'checkOutDate',
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status: string) => (
                          <Tag color={status === 'Nhận phòng' ? 'green' : 'blue'}>
                            {status}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Thao tác',
                        key: 'action',
                        render: (_, record) => (
                          <Button type="primary" size="small">
                            {record.action}
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={roomsNeedAttention}
                    pagination={false}
                    bordered
                    locale={{ emptyText: 'Không có phòng nào cần quản lý hôm nay' }}
                  />
                </Spin>
              </Card>
            </div>
          )}
          {selectedMenu === 'rooms' && (
            <RoomManagement />
          )}
          {selectedMenu === 'room-status' && (
            <RoomStatusDashboard />
          )}
          {selectedMenu === 'customer-analytics' && (
            <CustomerAnalyticsDashboard />
          )}
          {selectedMenu === 'advanced-search' && (
            <AdvancedSearchDashboard />
          )}
          {selectedMenu === 'notifications' && (
            <NotificationPanel />
          )}
          {selectedMenu === 'bookings' && (
            <BookingManagement />
          )}
          {selectedMenu === 'customers' && (
            <CustomerManagement />
          )}
          {selectedMenu === 'services' && (
            <ServiceManagement />
          )}
          {selectedMenu === 'bills' && (
            <BillManagement />
          )}
          {selectedMenu === 'revenue' && (
            <RevenueCharts />
          )}
          {selectedMenu === 'shifts' && (
            <div>
              <h2>Quản lý ca làm việc</h2>
              <p>Tính năng đang được phát triển...</p>
            </div>
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