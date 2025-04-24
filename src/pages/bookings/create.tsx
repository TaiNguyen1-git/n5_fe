import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, DatePicker, InputNumber, Select, Button, Card, Divider, message, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';
import styles from '../../styles/BookingCreate.module.css';
import { getRoomById, Room } from '../../services/roomService';
import { isAuthenticated, getCurrentUser, redirectToLoginIfNotAuthenticated } from '../../services/authService';
import dayjs from 'dayjs';

// Interface for the booking form
interface BookingFormValues {
  fullName: string;
  email: string;
  phone: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  guestCount: number;
  specialRequests?: string;
}

export default function BookingCreate() {
  const router = useRouter();
  const { roomId } = router.query;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form] = Form.useForm();
  
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [nights, setNights] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Get room details when roomId is available
  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);
  
  // Initialize default dates if not set
  useEffect(() => {
    if (room && (!checkInDate || !checkOutDate)) {
      // Sử dụng đối tượng dayjs thay vì chuỗi
      const today = dayjs();
      const tomorrow = dayjs().add(1, 'day');
      
      if (!checkInDate) {
        setCheckInDate(today.format('YYYY-MM-DD'));
        form.setFieldsValue({ checkInDate: today });
      }
      
      if (!checkOutDate) {
        setCheckOutDate(tomorrow.format('YYYY-MM-DD'));
        form.setFieldsValue({ checkOutDate: tomorrow });
      }
    }
  }, [room]);
  
  // Set user data if authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        form.setFieldsValue({
          fullName: user.fullName || '',
          email: user.email || '',
          // @ts-ignore - phone might not be defined in User type
          phone: user.phone || ''
        });
      }
    } else {
      // Redirect to login if not authenticated
      message.error('Vui lòng đăng nhập để đặt phòng');
      redirectToLoginIfNotAuthenticated('/bookings/create?roomId=' + roomId);
    }
  }, []);
  
  // Calculate total price when dates or room changes
  useEffect(() => {
    if (room && room.giaTien && checkInDate && checkOutDate) {
      const start = dayjs(checkInDate);
      const end = dayjs(checkOutDate);
      const nightCount = end.diff(start, 'day');
      
      if (nightCount > 0) {
        setNights(nightCount);
        setTotalPrice(room.giaTien * nightCount);
      } else {
        // Mặc định là 1 đêm nếu ngày không hợp lệ
        setNights(1);
        setTotalPrice(room.giaTien);
      }
    } else if (room && room.giaTien) {
      // Mặc định hiển thị giá cho 1 đêm nếu chưa chọn ngày
      setNights(1);
      setTotalPrice(room.giaTien);
    }
  }, [room, checkInDate, checkOutDate]);
  
  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      const response = await getRoomById(roomId as string);
      if (response && response.success && response.data) {
        // Đảm bảo giá trị giaTien luôn là số
        const roomData = {
          ...response.data,
          giaTien: response.data.giaTien || 0
        };
        setRoom(roomData);
        
        // Đặt giá mặc định cho 1 đêm
        setTotalPrice(roomData.giaTien);
      } else {
        setError('Không thể tìm thấy thông tin phòng');
      }
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi tải thông tin phòng');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckInChange = (date: any, dateString: string | string[]) => {
    setCheckInDate(dateString as string);
    // Không cần set lại form field vì DatePicker đã tự cập nhật
  };
  
  const handleCheckOutChange = (date: any, dateString: string | string[]) => {
    setCheckOutDate(dateString as string);
    // Không cần set lại form field vì DatePicker đã tự cập nhật
  };
  
  const handleGuestCountChange = (value: number | null) => {
    if (value !== null) {
      setGuestCount(value);
      form.setFieldsValue({ guestCount: value });
    }
  };
  
  const handleSubmit = (values: BookingFormValues) => {
    if (!room || !room.giaTien) return;
    
    // Store booking information for payment page
    const bookingData = {
      roomId: roomId,
      roomType: room.tenPhong,
      roomImage: room.hinhAnh,
      pricePerNight: room.giaTien,
      totalPrice: totalPrice,
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      nights: nights,
      guestCount: values.guestCount,
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      specialRequests: values.specialRequests
    };
    
    // Convert to query string format for the payment page
    const item = {
      id: roomId,
      name: room.tenPhong,
      description: `${nights} đêm · ${values.checkInDate} đến ${values.checkOutDate}`,
      price: totalPrice,
      category: 'Phòng',
      quantity: 1
    };
    
    // Navigate to payment page with room information
    router.push({
      pathname: '/payment',
      query: { 
        items: JSON.stringify([item])
      }
    });
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Đặt phòng</h1>
        
        <Row gutter={24}>
          <Col xs={24} sm={24} md={16} lg={16} xl={16}>
            <Card title="Thông tin đặt phòng" bordered={false} className={styles.bookingCard}>
              {loading ? (
                <div className={styles.loading}>Đang tải thông tin phòng...</div>
              ) : error ? (
                <div className={styles.error}>{error}</div>
              ) : room ? (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  className={styles.bookingForm}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Ngày nhận phòng"
                        name="checkInDate"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày nhận phòng' }]}
                      >
                        <DatePicker 
                          format="YYYY-MM-DD"
                          onChange={handleCheckInChange}
                          disabledDate={(current) => {
                            return current ? current < dayjs().startOf('day') : false;
                          }}
                          style={{ width: '100%' }}
                          placeholder="Chọn ngày nhận phòng"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Ngày trả phòng"
                        name="checkOutDate"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày trả phòng' }]}
                      >
                        <DatePicker 
                          format="YYYY-MM-DD"
                          onChange={handleCheckOutChange}
                          disabledDate={(current) => {
                            if (!current) return false;
                            const checkInDay = form.getFieldValue('checkInDate');
                            return current < dayjs().startOf('day') || 
                                  (checkInDay && current < checkInDay);
                          }}
                          style={{ width: '100%' }}
                          placeholder="Chọn ngày trả phòng"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    label="Số lượng khách"
                    name="guestCount"
                    initialValue={1}
                    rules={[{ required: true, message: 'Vui lòng chọn số lượng khách' }]}
                  >
                    <InputNumber 
                      min={1} 
                      max={room.soLuongKhach || 1} 
                      onChange={handleGuestCountChange}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  
                  <Divider />
                  
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                  </Form.Item>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Vui lòng nhập email' },
                          { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                      >
                        <Input prefix={<MailOutlined />} placeholder="Nhập email" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                      >
                        <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    label="Yêu cầu đặc biệt (không bắt buộc)"
                    name="specialRequests"
                  >
                    <Input.TextArea 
                      rows={4} 
                      placeholder="Nhập yêu cầu đặc biệt nếu có" 
                    />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      size="large"
                      className={styles.submitButton}
                    >
                      Tiến hành thanh toán
                    </Button>
                  </Form.Item>
                </Form>
              ) : null}
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            <Card title="Thông tin phòng" bordered={false} className={styles.roomCard}>
              {room && (
                <>
                  <div className={styles.roomImage}>
                    <img src={room.hinhAnh} alt={room.tenPhong} />
                  </div>
                  
                  <h2 className={styles.roomName}>{room.tenPhong}</h2>
                  <p className={styles.roomDescription}>{room.moTa}</p>
                  
                  <Divider />
                  
                  <div className={styles.roomDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Sức chứa:</span>
                      <span className={styles.detailValue}>{room.soLuongKhach || 0} người</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Giá mỗi đêm:</span>
                      <span className={styles.detailValue}>
                        {(room.giaTien || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div className={styles.priceBreakdown}>
                    <h3>Chi tiết giá</h3>
                    
                    <div className={styles.priceItem}>
                      <span>
                        {(room.giaTien || 0).toLocaleString('vi-VN')} đ x {nights} đêm
                      </span>
                      <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                    
                    <Divider />
                    
                    <div className={styles.totalPrice}>
                      <span>Tổng cộng:</span>
                      <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
} 