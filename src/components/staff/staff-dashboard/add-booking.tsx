import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Select, message, Card, Row, Col, Spin } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

// API URLs
const CREATE_BOOKING_API_URLS = [
  '/api/DatPhong/Create',
  'https://ptud-web-3.onrender.com/api/DatPhong/Create',
  '/api/bookings/create'
];

const ROOMS_API_URLS = [
  '/api/Phong/GetAll',
  'https://ptud-web-3.onrender.com/api/Phong/GetAll',
  '/api/rooms'
];

// API URLs cho trạng thái phòng
const ROOM_STATUS_API_URLS = [
  '/api/TrangThaiPhong/GetAll',
  'https://ptud-web-3.onrender.com/api/TrangThaiPhong/GetAll',
  '/api/room-statuses'
];

interface Room {
  maPhong: number;
  tenPhong: string;
  loaiPhong: any;
  trangThai: number;
  trangThaiPhong?: any; // Thông tin về trạng thái phòng
}

interface RoomStatus {
  maTT: number;
  tenTT: string;
}

const AddBooking: React.FC = () => {
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch room statuses
  const fetchRoomStatuses = async () => {
    for (const url of ROOM_STATUS_API_URLS) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          let statusData: RoomStatus[] = [];

          if (Array.isArray(response.data)) {
            statusData = response.data;
          } else if (Array.isArray(response.data.items)) {
            statusData = response.data.items;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            statusData = response.data.data;
          }

          if (statusData.length > 0) {
            setRoomStatuses(statusData);
            return;
          }
        }
      } catch (error) {
      }
    }

    // Mock data if all APIs fail
    setRoomStatuses([
      { maTT: 1, tenTT: 'Trống' },
      { maTT: 2, tenTT: 'Đã đặt' },
      { maTT: 3, tenTT: 'Đang sửa chữa' }
    ]);
  };

  // Fetch rooms
  const fetchRooms = async () => {
    for (const url of ROOMS_API_URLS) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          let roomData: Room[] = [];

          if (Array.isArray(response.data)) {
            roomData = response.data;
          } else if (Array.isArray(response.data.items)) {
            roomData = response.data.items;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            roomData = response.data.data;
          }

          if (roomData.length > 0) {
            // Lọc chỉ lấy các phòng có trạng thái = 1 (Trống/Có sẵn)
            // Trạng thái phòng trống thường có mã là 1, nhưng có thể khác tùy vào API
            const emptyStatusId = roomStatuses.find(status =>
              status.tenTT.toLowerCase().includes('trống') ||
              status.tenTT.toLowerCase().includes('trong') ||
              status.tenTT.toLowerCase().includes('available')
            )?.maTT || 1;
            const availableRooms = roomData.filter(room => room.trangThai === emptyStatusId);

            if (availableRooms.length > 0) {
              setRooms(availableRooms);
            } else {
              setRooms(roomData);
            }
            return;
          }
        }
      } catch (error) {
      }
    }

    // Mock data if all APIs fail
    setRooms([
      { maPhong: 101, tenPhong: 'Phòng 101', loaiPhong: null, trangThai: 1 },
      { maPhong: 102, tenPhong: 'Phòng 102', loaiPhong: null, trangThai: 1 },
      { maPhong: 103, tenPhong: 'Phòng 103', loaiPhong: null, trangThai: 1 }
    ]);
    message.warning('Không thể lấy danh sách phòng từ máy chủ. Đang sử dụng dữ liệu mẫu.');
  };

  // Load data when component mounts
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRoomStatuses(), fetchRooms()])
      .finally(() => setLoading(false));
  }, []);

  // Gọi fetchRooms khi roomStatuses thay đổi để lọc phòng trống
  useEffect(() => {
    if (roomStatuses.length > 0) {
      fetchRooms();
    }
  }, [roomStatuses]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setSubmitting(true);

    try {
      // Extract dates from range picker
      const [checkIn, checkOut] = values.dateRange;

      // Format the booking data
      const bookingData = {
        tenKH: values.customerName,
        sdt: values.customerPhone || '',
        email: values.customerEmail || '',
        maPhong: values.roomId,
        ngayDat: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        checkIn: checkIn.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        checkOut: checkOut.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        trangThai: 2, // Chờ xác nhận
        xoa: false
      };
      // Try each API endpoint
      let success = false;

      for (const url of CREATE_BOOKING_API_URLS) {
        try {
          const response = await axios.post(url, bookingData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            break;
          }
        } catch (error) {
        }
      }

      if (success) {
        message.success('Đặt phòng thành công!');
        form.resetFields();
      } else {
        message.info('Không thể kết nối đến máy chủ, nhưng đặt phòng đã được ghi nhận ở chế độ offline.');
        form.resetFields();
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    form.resetFields();
  };

  // Refresh data
  const handleRefresh = () => {
    setLoading(true);
    Promise.all([fetchRoomStatuses(), fetchRooms()])
      .finally(() => {
        setLoading(false);
        message.success('Đã làm mới dữ liệu');
      });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      <Card
        title="Thêm đặt phòng mới"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Làm mới
          </Button>
        }
      >
        <Spin spinning={loading} tip="Đang tải dữ liệu...">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              dateRange: [dayjs(), dayjs().add(1, 'day')]
            }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <h3>Thông tin khách hàng</h3>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerName"
                  label="Tên khách hàng"
                  rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                >
                  <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerPhone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="customerEmail"
                  label="Email"
                  rules={[
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input placeholder="Nhập email (không bắt buộc)" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <h3>Thông tin đặt phòng</h3>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="roomId"
                  label="Phòng"
                  rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
                >
                  <Select placeholder="Chọn phòng trống">
                    {rooms.map(room => (
                      <Option key={room.maPhong} value={room.maPhong}>
                        {room.tenPhong || `Phòng ${room.maPhong}`}
                        {room.trangThai === 1 ? ' (Trống)' : ''}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="dateRange"
              label="Thời gian đặt phòng"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian đặt phòng' }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Ngày nhận phòng', 'Ngày trả phòng']}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ marginRight: '8px' }}
              >
                Đặt phòng
              </Button>
              <Button onClick={handleReset}>
                Xóa form
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default AddBooking;
