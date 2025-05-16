import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Table, Tag, Button, Space, Modal, Input, Tabs, Card, Statistic, Row, Col, Select, DatePicker, Empty } from 'antd';
import { EyeOutlined, CloseOutlined, CheckOutlined, HistoryOutlined, CalendarOutlined } from '@ant-design/icons';
import styles from '../../styles/Bookings.module.css';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import { getUserBookings, cancelBooking } from '../../services/roomService';
import Layout from '../../components/Layout';
import dayjs from 'dayjs';
import axios from 'axios';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// Backend API endpoints
const BASE_URL = 'https://ptud-web-1.onrender.com/api';

interface ApiBooking {
  maHD: number;
  maPhong: number;
  maKH?: string;
  tenKH: string;
  email: string;
  soDienThoai?: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  soLuongKhach: number;
  tongTien: number;
  trangThai: number;
  ngayTao?: string;
}

interface Booking {
  id: number;
  maHD: number;
  maPhong: number;
  roomNumber: string;
  roomType: string;
  tenPhong: string;
  checkIn: string;
  checkOut: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  totalAmount: number;
  tongTien: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  createdAt: string;
  ngayTao?: string;
  trangThai: number;
}

export default function BookingHistory() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      router.push('/login?redirect=bookings');
      return;
    }

    // Fetch bookings
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const user = getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user's bookings
      const response = await getUserBookings(user.id.toString());

      if (response.success && response.data) {
        // Get room details for each booking to get room name and type
        const bookingData = response.data as ApiBooking[];
        const enrichedBookings = await Promise.all(
          bookingData.map(async (booking: ApiBooking) => {
            try {
              // Get room information
              const roomResponse = await axios.get(`${BASE_URL}/Phong/GetById?id=${booking.maPhong}`, {
                timeout: 5000
              });

              const room = roomResponse.data;



              // Map API response to our interface
              return {
                id: booking.maHD,
                maHD: booking.maHD,
                maPhong: booking.maPhong,
                roomNumber: room?.maPhong?.toString() || booking.maPhong.toString(),
                roomType: room?.loaiPhong || 'Standard',
                tenPhong: room?.ten || 'Phòng không xác định',
                checkIn: booking.ngayBatDau,
                checkOut: booking.ngayKetThuc,
                ngayBatDau: booking.ngayBatDau,
                ngayKetThuc: booking.ngayKetThuc,
                totalAmount: booking.tongTien,
                tongTien: booking.tongTien,
                status: getBookingStatus(booking.ngayBatDau, booking.ngayKetThuc, booking.trangThai),
                paymentStatus: booking.trangThai === 2 ? 'refunded' : 'paid',
                createdAt: booking.ngayTao || new Date().toISOString(),
                ngayTao: booking.ngayTao,
                trangThai: booking.trangThai
              };
            } catch (roomErr) {
              console.warn(`Error fetching room data for booking ${booking.maHD}:`, roomErr);

              // Return basic booking data even if we couldn't get room details
              return {
                id: booking.maHD,
                maHD: booking.maHD,
                maPhong: booking.maPhong,
                roomNumber: booking.maPhong.toString(),
                roomType: 'Standard',
                tenPhong: 'Phòng không xác định',
                checkIn: booking.ngayBatDau,
                checkOut: booking.ngayKetThuc,
                ngayBatDau: booking.ngayBatDau,
                ngayKetThuc: booking.ngayKetThuc,
                totalAmount: booking.tongTien,
                tongTien: booking.tongTien,
                status: getBookingStatus(booking.ngayBatDau, booking.ngayKetThuc, booking.trangThai),
                paymentStatus: booking.trangThai === 2 ? 'refunded' : 'paid',
                createdAt: booking.ngayTao || new Date().toISOString(),
                ngayTao: booking.ngayTao,
                trangThai: booking.trangThai
              };
            }
          })
        );

        setBookings(enrichedBookings as Booking[]);
      } else {
        setError(response.message || 'Không thể tải dữ liệu đặt phòng');
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Không thể tải dữ liệu đặt phòng. Vui lòng thử lại sau.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine booking status
  const getBookingStatus = (checkInDate: string, checkOutDate: string, trangThai?: number): 'upcoming' | 'active' | 'completed' | 'cancelled' => {
    if (trangThai === 0) return 'cancelled';

    const now = dayjs();
    const checkIn = dayjs(checkInDate);
    const checkOut = dayjs(checkOutDate);

    if (now.isBefore(checkIn)) return 'upcoming';
    if (now.isAfter(checkOut)) return 'completed';
    if (now.isAfter(checkIn) && now.isBefore(checkOut)) return 'active';

    return 'completed';
  };

  const handleViewBooking = (booking: Booking) => {
    setViewBooking(booking);
    setIsModalVisible(true);
  };

  const handleCancelBooking = async (id: number) => {
    Modal.confirm({
      title: 'Xác nhận hủy đặt phòng',
      content: 'Bạn có chắc chắn muốn hủy đặt phòng này? Hành động này không thể hoàn tác.',
      okText: 'Hủy đặt phòng',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: async () => {
        try {
          const response = await cancelBooking(id);
          if (response.success) {
            // Update booking status locally
            setBookings(bookings.map(booking =>
              booking.id === id ? {
                ...booking,
                status: 'cancelled',
                paymentStatus: 'refunded',
                trangThai: 0
              } : booking
            ));

            Modal.success({
              title: 'Hủy đặt phòng thành công',
              content: 'Đã hủy đặt phòng thành công. Tiền hoàn lại sẽ được xử lý trong vòng 7 ngày làm việc.'
            });
          } else {
            Modal.error({
              title: 'Lỗi',
              content: response.message || 'Không thể hủy đặt phòng. Vui lòng thử lại sau.'
            });
          }
        } catch (err) {
          console.error('Error cancelling booking:', err);
          Modal.error({
            title: 'Lỗi',
            content: 'Không thể hủy đặt phòng. Vui lòng thử lại sau.'
          });
        }
      }
    });
  };



  const filteredBookings = bookings.filter(booking => {
    // Filter by tab
    if (activeTab !== 'all' && booking.status !== activeTab) {
      return false;
    }

    // Filter by date range
    if (dateRange) {
      const checkInDate = dayjs(booking.checkIn);
      const checkOutDate = dayjs(booking.checkOut);
      const startDate = dateRange[0];
      const endDate = dateRange[1];

      // Check if booking dates overlap with selected date range
      if (checkOutDate.isBefore(startDate) || checkInDate.isAfter(endDate)) {
        return false;
      }
    }

    return true;
  });

  const getStatusTag = (status: string) => {
    switch(status) {
      case 'upcoming':
        return <Tag color="blue">Sắp tới</Tag>;
      case 'active':
        return <Tag color="green">Đang diễn ra</Tag>;
      case 'completed':
        return <Tag color="purple">Đã hoàn thành</Tag>;
      case 'cancelled':
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getPaymentStatusTag = (status: string) => {
    switch(status) {
      case 'paid':
        return <Tag color="green">Đã thanh toán</Tag>;
      case 'unpaid':
        return <Tag color="orange">Chưa thanh toán</Tag>;
      case 'refunded':
        return <Tag color="blue">Đã hoàn tiền</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Phòng',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      render: (text: string, record: Booking) => (
        <span>
          <b>{text}</b> ({record.roomType})
        </span>
      ),
    },
    {
      title: 'Ngày nhận phòng',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày trả phòng',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Thanh toán',
      key: 'paymentStatus',
      dataIndex: 'paymentStatus',
      render: (status: string) => getPaymentStatusTag(status),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (text: string, record: Booking) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewBooking(record)}
            size="small"
          >
            Chi tiết
          </Button>

          {record.status === 'upcoming' && (
            <Button
              icon={<CloseOutlined />}
              onClick={() => handleCancelBooking(record.id)}
              size="small"
              danger
            >
              Hủy đặt phòng
            </Button>
          )}


        </Space>
      ),
    },
  ];

  // Dashboard stats
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming').length;
  const activeBookings = bookings.filter(b => b.status === 'active').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const totalSpent = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Lịch sử đặt phòng</h1>

          {error && <div className={styles.error}>{error}</div>}

          {/* Dashboard Stats */}
          <div className={styles.bookingStats}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card>
                  <Statistic
                    title="Tổng số đặt phòng"
                    value={totalBookings}
                    prefix={<HistoryOutlined style={{ fontSize: '18px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card>
                  <Statistic
                    title="Sắp tới"
                    value={upcomingBookings}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<CalendarOutlined style={{ fontSize: '18px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card>
                  <Statistic
                    title="Đang diễn ra"
                    value={activeBookings}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckOutlined style={{ fontSize: '18px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card>
                  <Statistic
                    title="Hoàn thành"
                    value={completedBookings}
                    valueStyle={{ color: '#722ed1' }}
                    prefix={<CheckOutlined style={{ fontSize: '18px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card>
                  <Statistic
                    title="Đã hủy"
                    value={cancelledBookings}
                    valueStyle={{ color: '#f5222d' }}
                    prefix={<CloseOutlined style={{ fontSize: '18px' }} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={4}>
                <Card>
                  <Statistic
                    title="Tổng chi tiêu"
                    value={totalSpent}
                    precision={0}
                    valueStyle={{ color: '#cf1322' }}
                    suffix="VNĐ"
                    formatter={(value) => value?.toLocaleString('vi-VN')}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Tất cả" key="all" />
              <TabPane tab="Sắp tới" key="upcoming" />
              <TabPane tab="Đang diễn ra" key="active" />
              <TabPane tab="Hoàn thành" key="completed" />
              <TabPane tab="Đã hủy" key="cancelled" />
            </Tabs>

            <div className={styles.dateFilter}>
              <span className={styles.filterLabel}>Lọc theo ngày:</span>
              <RangePicker
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                format="DD/MM/YYYY"
              />
            </div>
          </div>

          {/* Bookings Table */}
          {loading ? (
            <div className={styles.loading}>Đang tải dữ liệu...</div>
          ) : bookings.length === 0 ? (
            <Empty description="Bạn chưa có đặt phòng nào" />
          ) : (
            <Table
              columns={columns}
              dataSource={filteredBookings}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className={styles.bookingsTable}
            />
          )}
        </div>

        {/* Booking Detail Modal */}
        <Modal
          title="Chi tiết đặt phòng"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>
          ]}
          width={700}
        >
          {viewBooking && (
            <div className={styles.bookingDetail}>
              <div className={styles.detailHeader}>
                <h3>{viewBooking.tenPhong || `Phòng ${viewBooking.roomNumber}`}</h3>
                <div className={styles.statusTags}>
                  {getStatusTag(viewBooking.status)}
                  {getPaymentStatusTag(viewBooking.paymentStatus)}
                </div>
              </div>

              <div className={styles.detailContent}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Mã đặt phòng:</span>
                      <span className={styles.value}>{viewBooking.maHD}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Ngày nhận phòng:</span>
                      <span className={styles.value}>{dayjs(viewBooking.checkIn).format('DD/MM/YYYY')}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Ngày trả phòng:</span>
                      <span className={styles.value}>{dayjs(viewBooking.checkOut).format('DD/MM/YYYY')}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Số đêm:</span>
                      <span className={styles.value}>
                        {dayjs(viewBooking.checkOut).diff(dayjs(viewBooking.checkIn), 'day')}
                      </span>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Loại phòng:</span>
                      <span className={styles.value}>{viewBooking.roomType}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Tổng tiền:</span>
                      <span className={styles.value}>
                        {viewBooking.totalAmount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Ngày đặt:</span>
                      <span className={styles.value}>{dayjs(viewBooking.createdAt).format('DD/MM/YYYY')}</span>
                    </div>

                  </Col>
                </Row>

                <div className={styles.bookingActions}>
                  {viewBooking.status === 'upcoming' && (
                    <Button
                      type="primary"
                      danger
                      onClick={() => {
                        setIsModalVisible(false);
                        handleCancelBooking(viewBooking.id);
                      }}
                    >
                      Hủy đặt phòng này
                    </Button>
                  )}

                  {viewBooking.status === 'completed' && !viewBooking.hasReview && (
                    <Button
                      type="primary"
                      onClick={() => {
                        setIsModalVisible(false);
                        handleOpenReviewModal(viewBooking);
                      }}
                    >
                      Viết đánh giá
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>


      </div>
    </Layout>
  );
}