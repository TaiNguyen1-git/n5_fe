import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Table, Tag, Button, Space, Modal, Rate, Input, Tabs, Card, Statistic, Row, Col, Select, DatePicker } from 'antd';
import { EyeOutlined, CloseOutlined, CheckOutlined, StarOutlined, HistoryOutlined, CalendarOutlined } from '@ant-design/icons';
import styles from '../../styles/Bookings.module.css';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Layout from '../../components/Layout';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Booking {
  id: number;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  createdAt: string;
  hasReview?: boolean;
}

export default function BookingHistory() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    bookingId: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      router.push('/login?redirect=bookings');
      return;
    }

    // Fetch bookings
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    setLoading(true);
    // Mock data for bookings
    const mockBookings: Booking[] = [
      {
        id: 1,
        roomNumber: '101',
        roomType: 'Single',
        checkIn: '2025-04-25',
        checkOut: '2025-04-28',
        totalAmount: 3000000,
        status: 'upcoming',
        paymentStatus: 'paid',
        createdAt: '2025-04-15',
      },
      {
        id: 2,
        roomNumber: '202',
        roomType: 'VIP',
        checkIn: '2025-04-10',
        checkOut: '2025-04-15',
        totalAmount: 10000000,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: '2025-03-25',
        hasReview: true
      },
      {
        id: 3,
        roomNumber: '103',
        roomType: 'Duo',
        checkIn: '2025-03-05',
        checkOut: '2025-03-08',
        totalAmount: 4500000,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: '2025-02-20',
      },
      {
        id: 4,
        roomNumber: '301',
        roomType: 'Triple',
        checkIn: '2025-05-10',
        checkOut: '2025-05-15',
        totalAmount: 7500000,
        status: 'cancelled',
        paymentStatus: 'refunded',
        createdAt: '2025-04-01',
      }
    ];

    setBookings(mockBookings);
    setLoading(false);
  };

  const handleViewBooking = (booking: Booking) => {
    setViewBooking(booking);
    setIsModalVisible(true);
  };

  const handleCancelBooking = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận hủy đặt phòng',
      content: 'Bạn có chắc chắn muốn hủy đặt phòng này? Hành động này không thể hoàn tác.',
      okText: 'Hủy đặt phòng',
      okType: 'danger',
      cancelText: 'Đóng',
      onOk: () => {
        // Update booking status to cancelled
        setBookings(bookings.map(booking => 
          booking.id === id ? {...booking, status: 'cancelled', paymentStatus: 'refunded'} : booking
        ));
      }
    });
  };

  const handleOpenReviewModal = (booking: Booking) => {
    setReviewData({
      rating: 5,
      comment: '',
      bookingId: booking.id
    });
    setIsReviewModalVisible(true);
  };

  const handleSubmitReview = () => {
    // Submit review logic
    setBookings(bookings.map(booking => 
      booking.id === reviewData.bookingId ? {...booking, hasReview: true} : booking
    ));
    setIsReviewModalVisible(false);
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
              danger
              onClick={() => handleCancelBooking(record.id)}
              size="small"
            >
              Hủy
            </Button>
          )}
          
          {record.status === 'completed' && !record.hasReview && (
            <Button 
              icon={<StarOutlined />} 
              type="primary"
              onClick={() => handleOpenReviewModal(record)}
              size="small"
            >
              Đánh giá
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Lịch sử đặt phòng</h1>
          
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Tổng đặt phòng" 
                  value={bookings.length} 
                  prefix={<HistoryOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Sắp tới" 
                  value={bookings.filter(b => b.status === 'upcoming').length} 
                  valueStyle={{ color: 'blue' }}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Đã hoàn thành" 
                  value={bookings.filter(b => b.status === 'completed').length} 
                  valueStyle={{ color: 'green' }}
                  prefix={<CheckOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Đã hủy" 
                  value={bookings.filter(b => b.status === 'cancelled').length} 
                  valueStyle={{ color: 'red' }}
                  prefix={<CloseOutlined />}
                />
              </Card>
            </Col>
          </Row>
          
          <div className={styles.filters}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              className={styles.tabs}
            >
              <TabPane tab="Tất cả" key="all" />
              <TabPane tab="Sắp tới" key="upcoming" />
              <TabPane tab="Đã hoàn thành" key="completed" />
              <TabPane tab="Đã hủy" key="cancelled" />
            </Tabs>
            
            <div className={styles.dateFilter}>
              <RangePicker 
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </div>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={filteredBookings}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 5 }}
            className={styles.table}
          />
        </div>
        
        {/* Modal xem chi tiết đặt phòng */}
        <Modal
          title="Chi tiết đặt phòng"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsModalVisible(false)}>
              Đóng
            </Button>
          ]}
          width={700}
        >
          {viewBooking && (
            <div className={styles.bookingDetail}>
              <div className={styles.bookingHeader}>
                <h2>Phòng {viewBooking.roomNumber} - {viewBooking.roomType}</h2>
                <div className={styles.statusTags}>
                  {getStatusTag(viewBooking.status)}
                  {getPaymentStatusTag(viewBooking.paymentStatus)}
                </div>
              </div>
              
              <div className={styles.bookingInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Ngày đặt:</span>
                  <span className={styles.value}>{dayjs(viewBooking.createdAt).format('DD/MM/YYYY')}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Ngày nhận phòng:</span>
                  <span className={styles.value}>{dayjs(viewBooking.checkIn).format('DD/MM/YYYY')}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Ngày trả phòng:</span>
                  <span className={styles.value}>{dayjs(viewBooking.checkOut).format('DD/MM/YYYY')}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Số ngày:</span>
                  <span className={styles.value}>{dayjs(viewBooking.checkOut).diff(dayjs(viewBooking.checkIn), 'day')} ngày</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Tổng tiền:</span>
                  <span className={styles.value}>{viewBooking.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
              
              {viewBooking.status === 'upcoming' && (
                <div className={styles.bookingActions}>
                  <Button 
                    type="primary" 
                    danger
                    onClick={() => {
                      handleCancelBooking(viewBooking.id);
                      setIsModalVisible(false);
                    }}
                  >
                    Hủy đặt phòng
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
        
        {/* Modal đánh giá */}
        <Modal
          title="Đánh giá dịch vụ"
          open={isReviewModalVisible}
          onCancel={() => setIsReviewModalVisible(false)}
          onOk={handleSubmitReview}
          okText="Gửi đánh giá"
          cancelText="Hủy"
        >
          <div className={styles.reviewForm}>
            <div className={styles.ratingContainer}>
              <span className={styles.ratingLabel}>Đánh giá của bạn:</span>
              <Rate 
                value={reviewData.rating} 
                onChange={value => setReviewData({...reviewData, rating: value})}
              />
            </div>
            
            <div className={styles.commentContainer}>
              <span className={styles.commentLabel}>Nhận xét:</span>
              <TextArea 
                rows={4} 
                value={reviewData.comment}
                onChange={e => setReviewData({...reviewData, comment: e.target.value})}
                placeholder="Chia sẻ trải nghiệm của bạn..."
              />
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}