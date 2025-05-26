import React, { useState, useEffect } from 'react';
import {
  Card,
  Timeline,
  Statistic,
  Row,
  Col,
  Tag,
  Button,
  Modal,
  Descriptions,
  Spin,
  message,
  Empty,
  Select,
  DatePicker
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  HomeOutlined,
  EyeOutlined,
  HeartOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { getCurrentUser } from '../../services/authService';

dayjs.extend(isBetween);

const { Option } = Select;
const { RangePicker } = DatePicker;

interface BookingData {
  maDatPhong: number;
  maKH: number;
  maPhong: number;
  ngayDat: string;
  checkIn: string;
  checkOut: string;
  trangThai: number;
  tongTien: number;
  tenKH?: string;
  soPhong?: string;
  loaiPhong?: string;
}

interface BookingStats {
  totalBookings: number;
  totalSpent: number;
  favoriteRoomType: string;
  averageStay: number;
  loyaltyPoints: number;
}

const EnhancedBookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    totalSpent: 0,
    favoriteRoomType: 'N/A',
    averageStay: 0,
    loyaltyPoints: 0
  });
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Fetch booking history
  const fetchBookingHistory = async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        message.error('Vui lòng đăng nhập để xem lịch sử đặt phòng');
        return;
      }

      // Call API to get user bookings
      const response = await fetch(`/api/booking?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const bookingData = Array.isArray(data.data) ? data.data : data.data.items || [];
          setBookings(bookingData);
          calculateStats(bookingData);
        } else {
          setBookings([]);
        }
      } else {
        throw new Error('Failed to fetch booking history');
      }
    } catch (error) {
      console.error('Error fetching booking history:', error);
      message.error('Không thể tải lịch sử đặt phòng');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate booking statistics
  const calculateStats = (bookingData: BookingData[]) => {
    if (bookingData.length === 0) {
      setStats({
        totalBookings: 0,
        totalSpent: 0,
        favoriteRoomType: 'N/A',
        averageStay: 0,
        loyaltyPoints: 0
      });
      return;
    }

    const totalBookings = bookingData.length;
    const totalSpent = bookingData.reduce((sum, booking) => sum + (booking.tongTien || 0), 0);

    // Calculate average stay duration
    const totalDays = bookingData.reduce((sum, booking) => {
      if (booking.checkIn && booking.checkOut) {
        const checkIn = dayjs(booking.checkIn);
        const checkOut = dayjs(booking.checkOut);
        return sum + checkOut.diff(checkIn, 'day');
      }
      return sum;
    }, 0);
    const averageStay = totalBookings > 0 ? totalDays / totalBookings : 0;

    // Calculate loyalty points (1 point per 100,000 VND spent)
    const loyaltyPoints = Math.floor(totalSpent / 100000);

    // Find favorite room type (mock data for now)
    const favoriteRoomType = 'Deluxe'; // This would need room type data from API

    setStats({
      totalBookings,
      totalSpent,
      favoriteRoomType,
      averageStay,
      loyaltyPoints
    });
  };

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  // Get status text and color
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1:
        return { text: 'Chờ xác nhận', color: 'orange' };
      case 2:
        return { text: 'Đã xác nhận', color: 'blue' };
      case 3:
        return { text: 'Đã nhận phòng', color: 'green' };
      case 4:
        return { text: 'Đã trả phòng', color: 'purple' };
      case 5:
        return { text: 'Đã huỷ', color: 'red' };
      case 6:
        return { text: 'Không đến', color: 'gray' };
      default:
        return { text: 'Không xác định', color: 'default' };
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter ? booking.trangThai === statusFilter : true;

    let matchesDateRange = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const bookingDate = dayjs(booking.ngayDat);
      matchesDateRange = bookingDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
    }

    return matchesStatus && matchesDateRange;
  });

  // Show booking details
  const showBookingDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Lịch sử đặt phòng nâng cao</h2>
        <p>Xem chi tiết lịch sử đặt phòng và thống kê cá nhân</p>
      </div>

      {/* Booking Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số lần đặt"
              value={stats.totalBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng chi tiêu"
              value={stats.totalSpent}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              formatter={(value) => `${value?.toLocaleString('vi-VN')}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Loại phòng yêu thích"
              value={stats.favoriteRoomType}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Điểm thành viên"
              value={stats.loyaltyPoints}
              prefix={<TrophyOutlined />}
              suffix="điểm"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: '100%' }}
            onChange={setStatusFilter}
            allowClear
          >
            <Option value={1}>Chờ xác nhận</Option>
            <Option value={2}>Đã xác nhận</Option>
            <Option value={3}>Đã nhận phòng</Option>
            <Option value={4}>Đã trả phòng</Option>
            <Option value={5}>Đã huỷ</Option>
            <Option value={6}>Không đến</Option>
          </Select>
        </Col>
        <Col span={8}>
          <RangePicker
            style={{ width: '100%' }}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            placeholder={['Từ ngày', 'Đến ngày']}
          />
        </Col>
        <Col span={8}>
          <Button onClick={fetchBookingHistory} loading={loading}>
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* Booking Timeline */}
      <Card title="Timeline đặt phòng">
        <Spin spinning={loading}>
          {filteredBookings.length === 0 ? (
            <Empty description="Không có lịch sử đặt phòng" />
          ) : (
            <Timeline mode="left">
              {filteredBookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.trangThai);
                return (
                  <Timeline.Item
                    key={booking.maDatPhong}
                    color={statusInfo.color}
                    label={dayjs(booking.ngayDat).format('DD/MM/YYYY')}
                  >
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <Row justify="space-between" align="middle">
                        <Col span={16}>
                          <div>
                            <strong>Phòng {booking.maPhong}</strong>
                            <Tag color={statusInfo.color} style={{ marginLeft: 8 }}>
                              {statusInfo.text}
                            </Tag>
                          </div>
                          <div style={{ marginTop: 4, color: '#666' }}>
                            {booking.checkIn && booking.checkOut && (
                              <>
                                {dayjs(booking.checkIn).format('DD/MM/YYYY')} - {dayjs(booking.checkOut).format('DD/MM/YYYY')}
                              </>
                            )}
                          </div>
                          <div style={{ marginTop: 4, fontWeight: 'bold', color: '#1890ff' }}>
                            {booking.tongTien?.toLocaleString('vi-VN')} VNĐ
                          </div>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => showBookingDetails(booking)}
                          >
                            Chi tiết
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          )}
        </Spin>
      </Card>

      {/* Booking Details Modal */}
      <Modal
        title="Chi tiết đặt phòng"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBooking && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã đặt phòng" span={2}>
              {selectedBooking.maDatPhong}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng số">
              {selectedBooking.maPhong}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusInfo(selectedBooking.trangThai).color}>
                {getStatusInfo(selectedBooking.trangThai).text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đặt">
              {dayjs(selectedBooking.ngayDat).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Check-in">
              {selectedBooking.checkIn ? dayjs(selectedBooking.checkIn).format('DD/MM/YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Check-out">
              {selectedBooking.checkOut ? dayjs(selectedBooking.checkOut).format('DD/MM/YYYY') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền" span={2}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                {selectedBooking.tongTien?.toLocaleString('vi-VN')} VNĐ
              </span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedBookingHistory;
