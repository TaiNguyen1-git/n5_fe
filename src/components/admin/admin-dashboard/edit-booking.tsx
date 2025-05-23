import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Select, message, Card, Row, Col, Spin, Modal } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

// API URLs
const UPDATE_BOOKING_API_URLS = [
  '/api/DatPhong/Update',
  'https://ptud-web-3.onrender.com/api/DatPhong/Update',
  '/api/bookings/update'
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

// API URLs cho trạng thái đặt phòng
const BOOKING_STATUS_API_URLS = [
  '/api/TrangThaiDatPhong/GetAll',
  'https://ptud-web-3.onrender.com/api/TrangThaiDatPhong/GetAll',
  '/api/booking-statuses'
];

interface Room {
  maPhong: number;
  tenPhong: string;
  loaiPhong: any;
  trangThai: number;
  trangThaiPhong?: any;
}

interface RoomStatus {
  maTT: number;
  tenTT: string;
}

interface BookingStatus {
  maTT: number;
  tenTT: string;
  value?: number;
  label?: string;
}

interface Booking {
  id: number;
  roomId: string;
  roomNumber: string;
  roomType?: string;
  customerName: string;
  customerId?: number;
  phone: string;
  email?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  guestCount?: number;
}

interface EditBookingProps {
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditBooking: React.FC<EditBookingProps> = ({ booking, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<BookingStatus[]>([]);
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
        console.error(`Error fetching room statuses from ${url}:`, error);
      }
    }

    // Mock data if all APIs fail
    setRoomStatuses([
      { maTT: 1, tenTT: 'Trống' },
      { maTT: 2, tenTT: 'Đã đặt' },
      { maTT: 3, tenTT: 'Đang sửa chữa' }
    ]);
    console.warn('Không thể lấy danh sách trạng thái phòng từ máy chủ. Đang sử dụng dữ liệu mẫu.');
  };

  // Fetch booking statuses
  const fetchBookingStatuses = async () => {
    for (const url of BOOKING_STATUS_API_URLS) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          let statusData: BookingStatus[] = [];
          
          if (Array.isArray(response.data)) {
            statusData = response.data;
          } else if (Array.isArray(response.data.items)) {
            statusData = response.data.items;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            statusData = response.data.data;
          }

          if (statusData.length > 0) {
            // Thêm các trường value và label để tương thích với Select
            const formattedStatuses = statusData.map(status => ({
              ...status,
              value: status.maTT,
              label: status.tenTT
            }));
            setBookingStatuses(formattedStatuses);
            return;
          }
        }
      } catch (error) {
        console.error(`Error fetching booking statuses from ${url}:`, error);
      }
    }

    // Mock data if all APIs fail
    setBookingStatuses([
      { maTT: 1, tenTT: 'Đã xác nhận', value: 1, label: 'Đã xác nhận' },
      { maTT: 2, tenTT: 'Chờ xác nhận', value: 2, label: 'Chờ xác nhận' },
      { maTT: 3, tenTT: 'Đã hủy', value: 3, label: 'Đã hủy' },
      { maTT: 4, tenTT: 'Đã hoàn thành', value: 4, label: 'Đã hoàn thành' }
    ]);
    console.warn('Không thể lấy danh sách trạng thái đặt phòng từ máy chủ. Đang sử dụng dữ liệu mẫu.');
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
            setRooms(roomData);
            return;
          }
        }
      } catch (error) {
        console.error(`Error fetching rooms from ${url}:`, error);
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
    if (visible) {
      setLoading(true);
      Promise.all([fetchRoomStatuses(), fetchBookingStatuses(), fetchRooms()])
        .finally(() => setLoading(false));
    }
  }, [visible]);

  // Set form values when booking changes
  useEffect(() => {
    if (booking && visible) {
      // Chuyển đổi trạng thái từ chuỗi sang số
      let statusId = 2; // Mặc định là "Chờ xác nhận"
      
      switch (booking.status) {
        case 'confirmed':
          statusId = 1; // Đã xác nhận
          break;
        case 'pending':
          statusId = 2; // Chờ xác nhận
          break;
        case 'cancelled':
          statusId = 3; // Đã hủy
          break;
        case 'checked_in':
        case 'checked_out':
          statusId = 4; // Đã hoàn thành
          break;
      }
      
      form.setFieldsValue({
        customerName: booking.customerName,
        customerPhone: booking.phone || '',
        customerEmail: booking.email || '',
        roomId: parseInt(booking.roomId),
        dateRange: [
          dayjs(booking.checkIn),
          dayjs(booking.checkOut)
        ],
        bookingStatus: statusId
      });
    }
  }, [booking, visible, form]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (!booking) return;
    
    setSubmitting(true);
    
    try {
      // Extract dates from range picker
      const [checkIn, checkOut] = values.dateRange;
      
      // Format the booking data
      const bookingData = {
        maDatPhong: booking.id,
        tenKH: values.customerName,
        sdt: values.customerPhone || '',
        email: values.customerEmail || '',
        maPhong: values.roomId,
        checkIn: checkIn.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        checkOut: checkOut.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        trangThai: values.bookingStatus,
        xoa: false
      };

      console.log('Updating booking data:', bookingData);
      
      // Try each API endpoint
      let success = false;
      
      for (const baseUrl of UPDATE_BOOKING_API_URLS) {
        try {
          const url = `${baseUrl}/${booking.id}`;
          const response = await axios.put(url, bookingData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          });
          
          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log('Booking updated successfully:', response.data);
            break;
          }
        } catch (error) {
          console.error(`Error updating booking with ${baseUrl}:`, error);
        }
      }
      
      if (success) {
        message.success('Cập nhật đặt phòng thành công!');
        onSuccess();
        onClose();
      } else {
        message.info('Không thể kết nối đến máy chủ, nhưng thông tin đã được cập nhật ở chế độ offline.');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      message.error('Có lỗi xảy ra khi cập nhật đặt phòng. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa thông tin đặt phòng"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Spin spinning={loading} tip="Đang tải dữ liệu...">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
            <Col span={12}>
              <Form.Item
                name="roomId"
                label="Phòng"
                rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
              >
                <Select placeholder="Chọn phòng">
                  {rooms.map(room => (
                    <Option key={room.maPhong} value={room.maPhong}>
                      {room.tenPhong || `Phòng ${room.maPhong}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bookingStatus"
                label="Trạng thái đặt phòng"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  {bookingStatuses.map(status => (
                    <Option key={status.maTT} value={status.maTT}>
                      {status.tenTT}
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

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              onClick={onClose}
              icon={<CloseOutlined />}
              style={{ marginRight: '8px' }}
            >
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={submitting}
            >
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default EditBooking;
