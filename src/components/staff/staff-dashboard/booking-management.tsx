import React, { useState } from 'react';
import { Table, Button, Tag, Space, Modal, DatePicker, Input, Select, Form, Card, Statistic, Row, Col, Tooltip, message } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

// Định nghĩa cấu trúc dữ liệu đặt phòng
interface Booking {
  id: number;
  roomNumber: string;
  roomType: string;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  paymentStatus: string;
  createdAt: string;
}

// Định nghĩa cấu trúc dữ liệu phòng trống
interface AvailableRoom {
  id: number;
  number: string;
  type: string;
  price: number;
}

// Khởi tạo mảng dữ liệu rỗng
const mockBookings: Booking[] = [];
const mockAvailableRooms: AvailableRoom[] = [];

const BookingManagement = () => {
  const [bookings, setBookings] = useState(mockBookings);
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<any>(null);

  // Xử lý xem chi tiết đặt phòng
  const handleView = (booking: any) => {
    setViewBooking(booking);
    setIsModalVisible(true);
  };

  // Xử lý xác nhận đặt phòng
  const handleConfirmBooking = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận đặt phòng',
      content: 'Bạn chắc chắn muốn xác nhận đặt phòng này?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => {
        try {
          const updatedBookings = bookings.map(booking =>
            booking.id === id ? {...booking, status: 'confirmed'} : booking
          );
          setBookings(updatedBookings);
          message.success('Đã xác nhận đặt phòng thành công!');
        } catch (error) {
          console.error('Lỗi khi xác nhận đặt phòng:', error);
          message.error('Có lỗi xảy ra khi xác nhận đặt phòng');
        }
      },
    });
  };

  // Xử lý từ chối đặt phòng
  const handleRejectBooking = (id: number) => {
    Modal.confirm({
      title: 'Từ chối đặt phòng',
      content: 'Bạn chắc chắn muốn từ chối đặt phòng này?',
      okText: 'Từ chối',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        try {
          const updatedBookings = bookings.map(booking =>
            booking.id === id ? {...booking, status: 'cancelled'} : booking
          );
          setBookings(updatedBookings);
          message.success('Đã từ chối đặt phòng!');
        } catch (error) {
          console.error('Lỗi khi từ chối đặt phòng:', error);
          message.error('Có lỗi xảy ra khi từ chối đặt phòng');
        }
      },
    });
  };

  // Xử lý xác nhận đặt phòng trực tiếp không qua Modal
  const handleConfirmBookingDirect = (id: number) => {
    try {
      const updatedBookings = [...bookings];
      const index = updatedBookings.findIndex(booking => booking.id === id);
      if (index !== -1) {
        updatedBookings[index] = {...updatedBookings[index], status: 'confirmed'};
        setBookings(updatedBookings);
        message.success('Đã xác nhận đặt phòng thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận đặt phòng:', error);
      message.error('Có lỗi xảy ra khi xác nhận đặt phòng');
    }
  };

  // Xử lý từ chối đặt phòng trực tiếp không qua Modal
  const handleRejectBookingDirect = (id: number) => {
    try {
      const updatedBookings = [...bookings];
      const index = updatedBookings.findIndex(booking => booking.id === id);
      if (index !== -1) {
        updatedBookings[index] = {...updatedBookings[index], status: 'cancelled'};
        setBookings(updatedBookings);
        message.success('Đã từ chối đặt phòng!');
      }
    } catch (error) {
      console.error('Lỗi khi từ chối đặt phòng:', error);
      message.error('Có lỗi xảy ra khi từ chối đặt phòng');
    }
  };

  // Xử lý thanh toán
  const handlePayment = (booking: any) => {
    setCurrentBooking(booking);
    setPaymentModalVisible(true);
  };

  // Xử lý xác nhận thanh toán
  const handleConfirmPayment = () => {
    setBookings(bookings.map(booking =>
      booking.id === currentBooking.id ? {...booking, paymentStatus: 'paid'} : booking
    ));
    setPaymentModalVisible(false);
    message.success('Đã xác nhận thanh toán thành công!');
  };

  // Xử lý tìm kiếm
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Xử lý lọc theo trạng thái
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Xử lý lọc theo ngày
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  // Lọc danh sách đặt phòng
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.guestName.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.phone.includes(searchText) ||
      booking.roomNumber.includes(searchText);

    const matchesStatus = statusFilter ? booking.status === statusFilter : true;

    let matchesDateRange = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const bookingCheckIn = dayjs(booking.checkIn);
      const bookingCheckOut = dayjs(booking.checkOut);
      const filterStart = dateRange[0];
      const filterEnd = dateRange[1];

      // Kiểm tra nếu khoảng thời gian đặt phòng có giao với khoảng thời gian lọc
      matchesDateRange = !(bookingCheckOut.isBefore(filterStart) || bookingCheckIn.isAfter(filterEnd));
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Định nghĩa các cột cho bảng
  const columns: ColumnsType<any> = [
    {
      title: 'Phòng',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      render: (text, record) => (
        <span>
          <b>{text}</b> ({record.roomType})
        </span>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'guestName',
      key: 'guestName',
      render: (text, record) => (
        <span>
          {text}<br />
          <small>{record.phone}</small>
        </span>
      ),
    },
    {
      title: 'Ngày nhận phòng',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày trả phòng',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      dataIndex: 'status',
      render: (status) => {
        let color = 'default';
        let text = '';

        switch(status) {
          case 'pending':
            color = 'gold';
            text = 'Chờ xác nhận';
            break;
          case 'confirmed':
            color = 'green';
            text = 'Đã xác nhận';
            break;
          case 'completed':
            color = 'blue';
            text = 'Hoàn thành';
            break;
          case 'cancelled':
            color = 'red';
            text = 'Đã hủy';
            break;
          default:
            text = status;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Thanh toán',
      key: 'paymentStatus',
      dataIndex: 'paymentStatus',
      render: (status) => {
        let color = status === 'paid' ? 'green' : 'volcano';
        let text = status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            size="small"
          >
            Xem
          </Button>

          {record.status === 'pending' && (
            <>
              <Button
                icon={<CheckCircleOutlined />}
                type="primary"
                onClick={() => handleConfirmBookingDirect(record.id)}
                size="small"
              >
                Xác nhận
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                danger
                onClick={() => handleRejectBookingDirect(record.id)}
                size="small"
              >
                Từ chối
              </Button>
            </>
          )}

          {record.status === 'confirmed' && record.paymentStatus === 'unpaid' && (
            <Button
              icon={<CreditCardOutlined />}
              type="primary"
              onClick={() => handlePayment(record)}
              size="small"
            >
              Thanh toán
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      <div style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng đặt phòng"
                value={bookings.length}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Chờ xác nhận"
                value={bookings.filter(b => b.status === 'pending').length}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã xác nhận"
                value={bookings.filter(b => b.status === 'confirmed').length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Chưa thanh toán"
                value={bookings.filter(b => b.paymentStatus === 'unpaid').length}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
        <Input.Search
          placeholder="Tìm kiếm theo tên, SĐT, phòng"
          onSearch={handleSearch}
          style={{ width: 300 }}
          allowClear
        />

        <Select
          placeholder="Lọc theo trạng thái"
          style={{
            width: 200,
            backgroundColor: '#fff'
          }}
          dropdownStyle={{ backgroundColor: '#fff' }}
          allowClear
          onChange={handleStatusFilterChange}
        >
          <Option value="pending" style={{ color: '#333' }}>Chờ xác nhận</Option>
          <Option value="confirmed" style={{ color: '#333' }}>Đã xác nhận</Option>
          <Option value="completed" style={{ color: '#333' }}>Hoàn thành</Option>
          <Option value="cancelled" style={{ color: '#333' }}>Đã hủy</Option>
        </Select>

        <RangePicker
          onChange={handleDateRangeChange}
          placeholder={['Từ ngày', 'Đến ngày']}
          style={{ backgroundColor: '#fff' }}
          popupStyle={{ backgroundColor: '#fff' }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

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
        bodyStyle={{ backgroundColor: '#fff', color: '#333' }}
      >
        {viewBooking && (
          <div>
            <p><strong>Phòng:</strong> {viewBooking.roomNumber} ({viewBooking.roomType})</p>
            <p><strong>Khách hàng:</strong> {viewBooking.guestName}</p>
            <p><strong>Số điện thoại:</strong> {viewBooking.phone}</p>
            <p><strong>Ngày nhận phòng:</strong> {dayjs(viewBooking.checkIn).format('DD/MM/YYYY')}</p>
            <p><strong>Ngày trả phòng:</strong> {dayjs(viewBooking.checkOut).format('DD/MM/YYYY')}</p>
            <p><strong>Số ngày:</strong> {dayjs(viewBooking.checkOut).diff(dayjs(viewBooking.checkIn), 'day')}</p>
            <p><strong>Tổng tiền:</strong> {viewBooking.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
            <p>
              <strong>Trạng thái:</strong> {' '}
              <Tag color={
                viewBooking.status === 'pending' ? 'gold' :
                viewBooking.status === 'confirmed' ? 'green' :
                viewBooking.status === 'completed' ? 'blue' : 'red'
              }>
                {
                  viewBooking.status === 'pending' ? 'Chờ xác nhận' :
                  viewBooking.status === 'confirmed' ? 'Đã xác nhận' :
                  viewBooking.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'
                }
              </Tag>
            </p>
            <p>
              <strong>Thanh toán:</strong> {' '}
              <Tag color={viewBooking.paymentStatus === 'paid' ? 'green' : 'volcano'}>
                {viewBooking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Tag>
            </p>
            <p><strong>Ngày đặt:</strong> {dayjs(viewBooking.createdAt).format('DD/MM/YYYY')}</p>
          </div>
        )}
      </Modal>

      {/* Modal thanh toán */}
      <Modal
        title="Xác nhận thanh toán"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handleConfirmPayment}
        okText="Xác nhận thanh toán"
        cancelText="Hủy"
        bodyStyle={{ backgroundColor: '#fff', color: '#333' }}
      >
        {currentBooking && (
          <div>
            <p><strong>Phòng:</strong> {currentBooking.roomNumber} ({currentBooking.roomType})</p>
            <p><strong>Khách hàng:</strong> {currentBooking.guestName}</p>
            <p><strong>Tổng tiền:</strong> {currentBooking.totalPrice.toLocaleString('vi-VN')} VNĐ</p>

            <Form layout="vertical" style={{ marginTop: 20 }}>
              <Form.Item label="Phương thức thanh toán" required>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  style={{ width: '100%' }}
                >
                  <Option value="cash">Tiền mặt</Option>
                  <Option value="card">Thẻ tín dụng</Option>
                  <Option value="transfer">Chuyển khoản</Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;
