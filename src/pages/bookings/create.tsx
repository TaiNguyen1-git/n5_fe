import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Form, Input, DatePicker, InputNumber, Button, Card, Divider, message, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
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
    // Kiểm tra xem phòng có giá không
    if (!room?.giaTien) {
      return; // Không tính toán nếu không có giá
    }

    const roomPrice = room.giaTien;

    if (room && checkInDate && checkOutDate) {
      const start = dayjs(checkInDate);
      const end = dayjs(checkOutDate);
      const nightCount = end.diff(start, 'day');

      if (nightCount > 0) {
        setNights(nightCount);
        setTotalPrice(roomPrice * nightCount);
      } else {
        // Mặc định là 1 đêm nếu ngày không hợp lệ
        setNights(1);
        setTotalPrice(roomPrice);
      }
    } else if (room) {
      // Mặc định hiển thị giá cho 1 đêm nếu chưa chọn ngày
      setNights(1);
      setTotalPrice(roomPrice);
    }
  }, [room, checkInDate, checkOutDate]);

  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      // Kiểm tra cache trước khi gọi API
      const cacheKey = `room_${roomId}`;
      const cachedRoomStr = localStorage.getItem(cacheKey);
      const cacheTimeStr = localStorage.getItem(`${cacheKey}_time`);

      if (cachedRoomStr && cacheTimeStr) {
        try {
          const cachedRoom = JSON.parse(cachedRoomStr);
          const cacheTime = new Date(cacheTimeStr);
          const now = new Date();

          // Nếu cache chưa quá 10 phút, sử dụng cache
          if ((now.getTime() - cacheTime.getTime()) < 10 * 60 * 1000) {
            console.log('Using cached room data');
            setRoom(cachedRoom);

            // Đặt giá mặc định cho 1 đêm nếu có giá
            if (cachedRoom.giaTien) {
              setTotalPrice(cachedRoom.giaTien);
            }

            setLoading(false);
            return;
          }
        } catch (cacheError) {
          console.warn('Error reading from cache:', cacheError);
        }
      }

      // Nếu không có cache hoặc cache đã hết hạn, gọi API
      const response = await getRoomById(roomId as string);
      if (response && response.success && response.data) {
        // Sử dụng dữ liệu phòng như được trả về từ API
        const roomData = response.data;
        setRoom(roomData);

        // Lưu vào cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify(roomData));
          localStorage.setItem(`${cacheKey}_time`, new Date().toISOString());
        } catch (cacheError) {
          console.warn('Error saving to cache:', cacheError);
        }

        // Đặt giá mặc định cho 1 đêm nếu có giá
        if (roomData.giaTien) {
          setTotalPrice(roomData.giaTien);
        } else {
          // Nếu không có giá, hiển thị thông báo
          setError('Không thể tính giá phòng này. Vui lòng liên hệ với khách sạn để biết thêm chi tiết.');
        }
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

  const handleCheckInChange = (_: any, dateString: string | string[]) => {
    setCheckInDate(dateString as string);
    // Không cần set lại form field vì DatePicker đã tự cập nhật
  };

  const handleCheckOutChange = (_: any, dateString: string | string[]) => {
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

    // Prepare booking information for payment page

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
            <Card title="Thông tin đặt phòng" className={styles.bookingCard}>
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
            <Card title="Thông tin phòng" className={styles.roomCard}>
              {room && (
                <>
                  <div className={styles.roomImage}>
                    <img
                      src={room.hinhAnh || '/images/rooms/default-room.jpg'}
                      alt={room.tenPhong}
                      loading="lazy"
                      width="100%"
                      height="auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/rooms/default-room.jpg';
                      }}
                    />
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
                        {`${(room.giaTien || 500000).toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </div>

                  <Divider />

                  <div className={styles.priceBreakdown}>
                    <h3>Chi tiết giá</h3>

                    <div className={styles.priceItem}>
                      <span>
                        {`${(room.giaTien || 500000).toLocaleString('vi-VN')} đ x ${nights} đêm`}
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