import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Input, Select, DatePicker, Card, Statistic, Row, Col, message } from 'antd';
import { EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { Option } = Select;
const { RangePicker } = DatePicker;
// API endpoints are handled by Next.js API routes in /pages/api

// Interface for booking data
interface Booking {
  id: number;
  roomId: string; // Original room ID from API
  roomNumber: string; // Room number fetched from room API
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

// Interface for customer data
interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address?: string;
  visits?: number;
}

// Interface for room data
interface Room {
  id: number;
  number: string;
  type: string;
  price: number;
  status: string;
  description?: string;
}

const BookingManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [roomDetails, setRoomDetails] = useState<Room | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomNumbersMap, setRoomNumbersMap] = useState<Record<string, string>>({});

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Fetch bookings from backend with retry logic
  const fetchBookings = async (retryCount = 0) => {
    setLoading(true);
    try {
      // Use the API proxy endpoint to avoid CORS issues
      const response = await axios.get(`/api/bookings`, {
        timeout: 15000, // 15 second timeout
      });

      // Check if response has data and items array
      if (!response.data || !Array.isArray(response.data.items)) {
        throw new Error('Invalid response format');
      }

      // First, create the basic booking objects
      const initialBookings = response.data.items.map((booking: any) => ({
        id: booking.maDatPhong || Math.floor(Math.random() * 1000),
        roomId: booking.maPhong?.toString() || '',
        roomNumber: booking.maPhong?.toString() || '', // Initially set to room ID, will be updated
        customerName: booking.tenKH || 'Khách hàng',
        customerId: booking.maKH,
        phone: booking.phone || '',
        email: booking.email || '',
        checkIn: booking.checkIn || dayjs().format('YYYY-MM-DD'),
        checkOut: booking.checkOut || dayjs().add(1, 'day').format('YYYY-MM-DD'),
        status: booking.trangThai === 1 ? 'pending' : // Mã 1 là "Chưa xác nhận"
                booking.trangThai === 2 ? 'confirmed' : // Mã 2 là "Đã xác nhận"
                booking.trangThai === 3 ? 'checked_in' : // Mã 3 là "Đã nhận phòng"
                booking.trangThai === 4 ? 'checked_out' : // Mã 4 là "Đã trả phòng"
                booking.trangThai === 0 ? 'cancelled' : 'pending',
        totalPrice: booking.tongTien || 0,
        createdAt: booking.ngayTao || dayjs().format('YYYY-MM-DD'),
        guestCount: booking.soLuongKhach || 1
      }));

      // Set initial bookings
      setBookings(initialBookings);

      // Then fetch room numbers for each booking
      const updatedBookings = await Promise.all(
        initialBookings.map(async (booking: Booking) => {
          if (!booking.roomId) return booking;

          try {
            // Fetch room details to get the room number
            const response = await axios.get(`/api/rooms/${booking.roomId}`, {
              timeout: 5000,
              validateStatus: () => true
            });

            if (response.status >= 200 && response.status < 300 && response.data) {
              const roomData = response.data.data || response.data;
              if (roomData && roomData.soPhong) {
                // Update room number in our map
                setRoomNumbersMap(prev => ({
                  ...prev,
                  [booking.roomId]: roomData.soPhong
                }));

                // Return updated booking with room number
                return {
                  ...booking,
                  roomNumber: roomData.soPhong,
                  roomType: roomData.loaiPhong || 'Standard'
                };
              }
            }
          } catch (error) {
            console.error(`Error fetching room details for booking ${booking.id}:`, error);
          }

          // If we couldn't get the room number, return the original booking
          return booking;
        })
      );

      // Update bookings with room numbers
      setBookings(updatedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);

      // Implement retry logic (max 3 retries)
      if (retryCount < 3) {
        message.warning(`Đang thử kết nối lại... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchBookings(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // If all retries fail, show error
      message.error('Không thể tải danh sách đặt phòng từ máy chủ.');

      // Set empty bookings array
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details with retry logic
  const fetchCustomerDetails = async (customerId: number, retryCount = 0) => {
    setCustomerLoading(true);
    try {
      // Use the API proxy endpoint to avoid CORS issues
      const response = await axios.get(`/api/customers/${customerId}`, {
        timeout: 8000, // 8 second timeout
        validateStatus: function () {
          // Accept all status codes to handle them manually
          return true;
        }
      }).catch(error => {
        console.error('Error in customer API request:', error.message);
        return { data: null, status: 500 };
      });

      // Check if the response status is successful
      if (response.status >= 200 && response.status < 300 && response.data && Object.keys(response.data).length > 0) {
        setCustomerDetails({
          id: response.data.maKH || customerId,
          name: response.data.hoTen || `Khách hàng #${customerId}`,
          phone: response.data.soDienThoai || '',
          email: response.data.email || '',
          address: response.data.diaChi || '',
          visits: response.data.soLanGheTham || 1
        });
      } else {
        console.log(`Customer API returned status ${response.status} or empty data`);
        throw new Error(`Failed to fetch customer data: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error processing customer details:', error.message);

      // Implement retry logic (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying customer details fetch (${retryCount + 1}/2)...`);
        setTimeout(() => {
          fetchCustomerDetails(customerId, retryCount + 1);
        }, 1500 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // Set customer details to null when we can't fetch data
      setCustomerDetails(null);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Fetch room details with retry logic for modal view
  const fetchRoomDetails = async (roomId: string, retryCount = 0) => {
    setRoomLoading(true);
    try {
      // Use the API proxy endpoint to avoid CORS issues
      const response = await axios.get(`/api/rooms/${roomId}`, {
        timeout: 8000, // 8 second timeout
        validateStatus: function () {
          // Accept all status codes to handle them manually
          return true;
        }
      }).catch(error => {
        console.error('Error in room API request:', error.message);
        return { data: null, status: 500 };
      });

      // Check if the response status is successful and data exists
      if (response.status >= 200 && response.status < 300 &&
          response.data &&
          (response.data.data || response.data.maPhong || response.data.soPhong)) {

        // Handle both response formats (with data property or direct properties)
        const roomData = response.data.data || response.data;

        setRoomDetails({
          id: roomData.maPhong || parseInt(roomId) || 0,
          number: roomData.soPhong || roomId,
          type: roomData.loaiPhong || 'Standard',
          price: roomData.giaPhong || roomData.price || 800000,
          status: roomData.trangThai === 1 ? 'available' :
                  roomData.trangThai === 2 ? 'occupied' :
                  roomData.trangThai === 3 ? 'maintenance' : 'unavailable',
          description: roomData.moTa || ''
        });
      } else {
        console.log(`Room API returned status ${response.status} or invalid data`);
        throw new Error(`Failed to fetch room data: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error processing room details:', error.message);

      // Implement retry logic (max 2 retries)
      if (retryCount < 2) {
        console.log(`Retrying room details fetch (${retryCount + 1}/2)...`);
        setTimeout(() => {
          fetchRoomDetails(roomId, retryCount + 1);
        }, 1500 * (retryCount + 1)); // Exponential backoff
        return;
      }

      // Set room details to null when we can't fetch data
      setRoomDetails(null);
    } finally {
      setRoomLoading(false);
    }
  };

  // Handle view booking details
  const handleView = (booking: Booking) => {
    setViewBooking(booking);
    setIsModalVisible(true);
    if (booking.customerId) {
      fetchCustomerDetails(booking.customerId);
    } else {
      setCustomerDetails(null);
    }
    fetchRoomDetails(booking.roomId);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Filter bookings based on search, date range, and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.phone.includes(searchText) ||
      booking.roomNumber.includes(searchText);

    const matchesStatus = statusFilter ? booking.status === statusFilter : true;

    let matchesDateRange = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const bookingCheckIn = dayjs(booking.checkIn);
      const bookingCheckOut = dayjs(booking.checkOut);
      const filterStart = dateRange[0];
      const filterEnd = dateRange[1];

      // Check if booking date range overlaps with filter date range
      matchesDateRange = !(bookingCheckOut.isBefore(filterStart) || bookingCheckIn.isAfter(filterEnd));
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Calculate statistics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;
  const checkedInBookings = bookings.filter(booking => booking.status === 'checked_in').length;
  const checkedOutBookings = bookings.filter(booking => booking.status === 'checked_out').length;
  const completedBookings = checkedInBookings + checkedOutBookings; // Combined for the statistics card
  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled').length;

  // Define columns for the table
  const columns: ColumnsType<Booking> = [
    {
      title: 'Phòng',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div>{record.customerName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.phone}</div>
        </div>
      ),
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: 'Ngày nhận phòng',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.checkIn).unix() - dayjs(b.checkIn).unix(),
    },
    {
      title: 'Ngày trả phòng',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.checkOut).unix() - dayjs(b.checkOut).unix(),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => a.totalPrice - b.totalPrice,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = '';

        switch(status) {
          case 'confirmed':
            color = 'green';
            text = 'Đã xác nhận';
            break;
          case 'pending':
            color = 'gold';
            text = 'Chưa xác nhận';
            break;
          case 'checked_in':
            color = 'blue';
            text = 'Đã nhận phòng';
            break;
          case 'checked_out':
            color = 'cyan';
            text = 'Đã trả phòng';
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
      filters: [
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Chưa xác nhận', value: 'pending' },
        { text: 'Đã nhận phòng', value: 'checked_in' },
        { text: 'Đã trả phòng', value: 'checked_out' },
        { text: 'Đã hủy', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          size="small"
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Quản lý đặt phòng</h2>
        <p>Xem và quản lý tất cả các đặt phòng trong hệ thống</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng đặt phòng"
              value={totalBookings}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã xác nhận"
              value={confirmedBookings}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã nhận/trả phòng"
              value={completedBookings}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hủy"
              value={cancelledBookings}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm theo tên, SĐT, phòng"
          onSearch={handleSearch}
          style={{ width: 300 }}
          allowClear
        />

        <RangePicker
          onChange={handleDateRangeChange}
          placeholder={['Từ ngày', 'Đến ngày']}
        />

        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 200 }}
          allowClear
          onChange={handleStatusFilterChange}
        >
          <Option value="confirmed">Đã xác nhận</Option>
          <Option value="pending">Chưa xác nhận</Option>
          <Option value="checked_in">Đã nhận phòng</Option>
          <Option value="checked_out">Đã trả phòng</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

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
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <h3>Thông tin đặt phòng</h3>
                <p><strong>Mã đặt phòng:</strong> #{viewBooking.id}</p>
                <p><strong>Ngày đặt:</strong> {dayjs(viewBooking.createdAt).format('DD/MM/YYYY')}</p>
                <p><strong>Ngày nhận phòng:</strong> {dayjs(viewBooking.checkIn).format('DD/MM/YYYY')}</p>
                <p><strong>Ngày trả phòng:</strong> {dayjs(viewBooking.checkOut).format('DD/MM/YYYY')}</p>
                <p><strong>Số ngày:</strong> {dayjs(viewBooking.checkOut).diff(dayjs(viewBooking.checkIn), 'day')}</p>
                <p><strong>Số khách:</strong> {viewBooking.guestCount || 1}</p>
                <p><strong>Tổng tiền:</strong> {viewBooking.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
                <p><strong>Trạng thái:</strong> <Tag color={
                  viewBooking.status === 'confirmed' ? 'green' :
                  viewBooking.status === 'pending' ? 'gold' :
                  viewBooking.status === 'checked_in' ? 'blue' :
                  viewBooking.status === 'checked_out' ? 'cyan' : 'red'
                }>
                  {viewBooking.status === 'confirmed' ? 'Đã xác nhận' :
                   viewBooking.status === 'pending' ? 'Chưa xác nhận' :
                   viewBooking.status === 'checked_in' ? 'Đã nhận phòng' :
                   viewBooking.status === 'checked_out' ? 'Đã trả phòng' : 'Đã hủy'}
                </Tag></p>
              </Col>
              <Col span={12}>
                <h3>Thông tin khách hàng</h3>
                {customerLoading ? (
                  <p>Đang tải thông tin khách hàng...</p>
                ) : customerDetails ? (
                  <>
                    <p><strong>Họ tên:</strong> {customerDetails.name}</p>
                    <p><strong>Số điện thoại:</strong> {customerDetails.phone}</p>
                    <p><strong>Email:</strong> {customerDetails.email}</p>
                    <p><strong>Địa chỉ:</strong> {customerDetails.address || 'Không có'}</p>
                    <p><strong>Số lần ghé thăm:</strong> {customerDetails.visits}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Họ tên:</strong> {viewBooking.customerName}</p>
                    <p><strong>Số điện thoại:</strong> {viewBooking.phone}</p>
                    <p><strong>Email:</strong> {viewBooking.email || 'Không có'}</p>
                    <p><strong>Khách hàng chưa đăng ký tài khoản</strong></p>
                  </>
                )}
              </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
              <h3>Thông tin phòng</h3>
              {roomLoading ? (
                <p>Đang tải thông tin phòng...</p>
              ) : roomDetails ? (
                <>
                  <p><strong>Số phòng:</strong> {roomDetails.number}</p>
                  <p><strong>Loại phòng:</strong> {roomDetails.type}</p>
                  <p><strong>Giá phòng:</strong> {roomDetails.price.toLocaleString('vi-VN')} VNĐ/đêm</p>
                  <p><strong>Trạng thái hiện tại:</strong> <Tag color={
                    roomDetails.status === 'available' ? 'green' :
                    roomDetails.status === 'occupied' ? 'orange' :
                    roomDetails.status === 'maintenance' ? 'red' : 'default'
                  }>
                    {roomDetails.status === 'available' ? 'Trống' :
                     roomDetails.status === 'occupied' ? 'Đang sử dụng' :
                     roomDetails.status === 'maintenance' ? 'Đang bảo trì' : 'Không khả dụng'}
                  </Tag></p>
                  <p><strong>Mô tả:</strong> {roomDetails.description || 'Không có mô tả'}</p>
                </>
              ) : (
                <p>Không thể tải thông tin phòng {viewBooking.roomNumber}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;
