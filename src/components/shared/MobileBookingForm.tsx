import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  DatePicker, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col,
  message,
  Modal,
  Divider
} from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Room {
  maPhong: number;
  tenPhong: string;
  soPhong: string;
  loaiPhong: {
    maLoai: number;
    tenLoai: string;
    giaPhong: number;
  };
}

interface MobileBookingFormProps {
  room: Room;
  onBookingSuccess?: (bookingData: any) => void;
}

const MobileBookingForm: React.FC<MobileBookingFormProps> = ({
  room,
  onBookingSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const calculateTotalPrice = (dates: any) => {
    if (!dates || !dates[0] || !dates[1]) return 0;
    
    const checkIn = dayjs(dates[0]);
    const checkOut = dayjs(dates[1]);
    const nights = checkOut.diff(checkIn, 'day');
    
    return nights * (room.loaiPhong?.giaPhong || 0);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const [checkIn, checkOut] = values.dates;
      const totalPrice = calculateTotalPrice(values.dates);
      
      const bookingPayload = {
        maPhong: room.maPhong,
        tenKH: values.tenKH,
        email: values.email,
        phone: values.phone,
        checkIn: checkIn.format('YYYY-MM-DD'),
        checkOut: checkOut.format('YYYY-MM-DD'),
        ngayDat: dayjs().format('YYYY-MM-DD'),
        tongTien: totalPrice,
        ghiChu: values.ghiChu || ''
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setBookingData({
        ...bookingPayload,
        maDatPhong: Math.floor(Math.random() * 10000),
        room: room
      });
      
      setSuccessModalVisible(true);
      
      if (onBookingSuccess) {
        onBookingSuccess(bookingPayload);
      }
      
      message.success('Đặt phòng thành công!');
      
    } catch (error) {
      message.error('Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current: any) => {
    return current && current < dayjs().startOf('day');
  };

  if (!isMobile) {
    // Return regular form for desktop
    return (
      <Card title="Đặt phòng" style={{ position: 'sticky', top: 20 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="dates"
            label="Ngày nhận - trả phòng"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              disabledDate={disabledDate}
              placeholder={['Ngày nhận phòng', 'Ngày trả phòng']}
            />
          </Form.Item>

          <Form.Item
            name="tenKH"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item name="ghiChu" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm (tùy chọn)" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
            >
              Đặt phòng ngay
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  }

  // Mobile optimized form
  return (
    <>
      <Card 
        style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          borderRadius: '16px 16px 0 0',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        <Title level={4} style={{ textAlign: 'center', marginBottom: 16 }}>
          Đặt phòng {room.soPhong}
        </Title>
        
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="dates"
            label="Ngày nhận - trả phòng"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <RangePicker
              style={{ width: '100%', minHeight: '44px' }}
              disabledDate={disabledDate}
              placeholder={['Ngày nhận phòng', 'Ngày trả phòng']}
              size="large"
            />
          </Form.Item>

          <Row gutter={[12, 0]}>
            <Col span={24}>
              <Form.Item
                name="tenKH"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Nhập họ và tên"
                  size="large"
                  style={{ minHeight: '44px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col span={24}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Nhập email"
                  size="large"
                  style={{ minHeight: '44px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 0]}>
            <Col span={24}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Nhập số điện thoại"
                  size="large"
                  style={{ minHeight: '44px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="ghiChu" label="Ghi chú">
            <Input.TextArea 
              rows={2} 
              placeholder="Ghi chú thêm (tùy chọn)"
              style={{ minHeight: '44px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
              style={{ 
                minHeight: '48px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Đặt phòng ngay
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Success Modal */}
      <Modal
        open={successModalVisible}
        onCancel={() => setSuccessModalVisible(false)}
        footer={[
          <Button 
            key="ok" 
            type="primary" 
            onClick={() => setSuccessModalVisible(false)}
            size="large"
            block
          >
            Đóng
          </Button>
        ]}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined 
            style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} 
          />
          <Title level={3}>Đặt phòng thành công!</Title>
          
          {bookingData && (
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              <Text strong>Mã đặt phòng: </Text>
              <Text>#{bookingData.maDatPhong}</Text>
              <br />
              <Text strong>Phòng: </Text>
              <Text>{bookingData.room?.soPhong}</Text>
              <br />
              <Text strong>Khách hàng: </Text>
              <Text>{bookingData.tenKH}</Text>
              <br />
              <Text strong>Ngày nhận phòng: </Text>
              <Text>{dayjs(bookingData.checkIn).format('DD/MM/YYYY')}</Text>
              <br />
              <Text strong>Ngày trả phòng: </Text>
              <Text>{dayjs(bookingData.checkOut).format('DD/MM/YYYY')}</Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default MobileBookingForm;
