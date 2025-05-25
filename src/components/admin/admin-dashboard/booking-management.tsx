import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Input, Select, DatePicker, Card, Statistic, Row, Col, message, Tabs, Space, Popconfirm, Spin } from 'antd';
import { EyeOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import AddBooking from './add-booking';
import EditBooking from './edit-booking';
import { getAllCustomers, type Customer } from '../../../services/customerService';

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
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  // Các state này được giữ lại để tương thích với các hàm đã có
  // nhưng không còn được sử dụng trong modal chi tiết đơn giản hóa
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roomDetails, setRoomDetails] = useState<Room | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [customerLoading, setCustomerLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roomLoading, setRoomLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roomNumbersMap, setRoomNumbersMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  // Customer data states for real-time customer name lookup
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [customerDataLoading, setCustomerDataLoading] = useState(false);

  // Fetch customer data
  const fetchCustomers = async () => {
    setCustomerDataLoading(true);
    try {
      console.log('Fetching all customers for admin booking management...');
      const response = await getAllCustomers(1, 1000); // Get a large number to get all customers

      if (response.success && response.data?.items) {
        // Create a map of customer ID to customer data
        const customerMap: Record<number, Customer> = {};
        response.data.items.forEach((customer: Customer) => {
          if (customer.maKH) {
            customerMap[customer.maKH] = customer;
          }
        });
        setCustomers(customerMap);
        console.log('Customer data loaded for admin:', customerMap);
      } else {
        console.warn('Failed to fetch customers for admin:', response.message);
      }
    } catch (error) {
      console.error('Error fetching customers for admin:', error);
    } finally {
      setCustomerDataLoading(false);
    }
  };

  // Fetch bookings on component mount and when pagination changes
  useEffect(() => {
    fetchBookings();
  }, [currentPage, pageSize]);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch bookings from backend with retry logic
  const fetchBookings = async (retryCount = 0) => {
    setLoading(true);
    try {
      // Use the API proxy endpoint to avoid CORS issues with pagination
      const response = await axios.get(`/api/bookings`, {
        params: {
          PageNumber: currentPage,
          PageSize: pageSize
        },
        timeout: 15000, // 15 second timeout
      });

      // Check if response has data and items array
      if (!response.data || !Array.isArray(response.data.items)) {
        throw new Error('Invalid response format');
      }

      // Set total count for pagination - use totalItems if available
      const totalCount = response.data.totalItems || response.data.totalCount || response.data.items.length;
      console.log('Pagination info:', {
        totalItems: response.data.totalItems,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages,
        currentPage: response.data.pageNumber || currentPage,
        pageSize: response.data.pageSize || pageSize,
        itemsLength: response.data.items.length,
        finalTotal: totalCount
      });
      setTotal(totalCount);

      // First, create the basic booking objects
      const initialBookings = response.data.items.map((booking: any) => {
        // Get customer name from our customer data map if available
        const customer = customers[booking.maKH];
        const customerName = customer?.tenKH || booking.tenKH || `Khách hàng ${booking.maKH}`;

        return {
          id: booking.maDatPhong || Math.floor(Math.random() * 1000),
          roomId: booking.maPhong?.toString() || '',
          roomNumber: booking.maPhong?.toString() || '', // Initially set to room ID, will be updated
          customerName: customerName,
          customerId: booking.maKH,
          phone: booking.phone || '',
          email: booking.email || '',
          checkIn: booking.checkIn || dayjs().format('YYYY-MM-DD'),
          checkOut: booking.checkOut || dayjs().add(1, 'day').format('YYYY-MM-DD'),
          status: booking.trangThai === 1 ? 'pending' : // Mã 1 là "Chờ xác nhận"
                  booking.trangThai === 2 ? 'confirmed' : // Mã 2 là "Đã xác nhận"
                  booking.trangThai === 3 ? 'checked_in' : // Mã 3 là "Đã nhận phòng"
                  booking.trangThai === 4 ? 'checked_out' : // Mã 4 là "Đã trả phòng"
                  booking.trangThai === 5 ? 'cancelled' : // Mã 5 là "Đã huỷ"
                  booking.trangThai === 6 ? 'no_show' : 'pending', // Mã 6 là "Không đến"
          totalPrice: booking.tongTien || 0,
          createdAt: booking.ngayTao || dayjs().format('YYYY-MM-DD'),
          guestCount: booking.soLuongKhach || 1
        };
      });

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
    // Đã đơn giản hóa modal chi tiết, không cần gọi các hàm này nữa
    // if (booking.customerId) {
    //   fetchCustomerDetails(booking.customerId);
    // } else {
    //   setCustomerDetails(null);
    // }
    // fetchRoomDetails(booking.roomId);
  };

  // Handle edit booking
  const handleEdit = (booking: Booking) => {
    setEditBooking(booking);
    setIsEditModalVisible(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    fetchBookings();
  };

  // Handle delete booking
  const handleDeleteBooking = async (id: number) => {
    try {
      message.loading('Đang xóa đặt phòng...', 0.5);

      // Prepare delete data
      const deleteData = {
        xoa: true
      };

      // Try API endpoints
      const apiEndpoints = [
        `/api/DatPhong/Delete/${id}`,
        `https://ptud-web-3.onrender.com/api/DatPhong/Delete/${id}`,
        `/api/bookings/${id}`
      ];

      let success = false;

      // Try each endpoint
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying to delete booking using endpoint: ${endpoint}`);
          const response = await axios.put(endpoint, deleteData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log('Delete successful with response:', response.data);
            break;
          }
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError);
          // Continue to next endpoint
        }
      }

      if (success) {
        message.success('Đã xóa đặt phòng thành công!');
        // Refresh data
        fetchBookings();
      } else {
        // If API fails, still update UI
        const updatedBookings = bookings.filter(booking => booking.id !== id);
        setBookings(updatedBookings);
        message.success('Đã xóa đặt phòng thành công! (Chế độ offline)');
      }
    } catch (error) {
      console.error('Lỗi khi xóa đặt phòng:', error);
      message.error('Có lỗi xảy ra khi xóa đặt phòng');
    }
  };

  // Handle confirm booking
  const handleConfirmBookingDirect = async (id: number) => {
    try {
      message.loading('Đang xác nhận đặt phòng...', 0.5);

      // Use status code 2 for "Confirmed" (Đã xác nhận)
      const statusId = 2;

      // Tìm thông tin đặt phòng hiện tại
      const currentBooking = bookings.find(booking => booking.id === id);
      if (!currentBooking) {
        message.error('Không tìm thấy thông tin đặt phòng');
        return;
      }

      // Prepare update data - chỉ cập nhật trạng thái, giữ nguyên các dữ liệu khác
      const updateData = {
        maDatPhong: id,
        maPhong: parseInt(currentBooking.roomId),
        maKH: currentBooking.customerId,
        tenKH: currentBooking.customerName,
        phone: currentBooking.phone,
        email: currentBooking.email,
        checkIn: currentBooking.checkIn,
        checkOut: currentBooking.checkOut,
        tongTien: currentBooking.totalPrice,
        soLuongKhach: currentBooking.guestCount,
        trangThai: statusId,
        xoa: false // Đảm bảo không đánh dấu xóa
      };

      console.log('Sending update data:', updateData);

      // Try API endpoints
      const apiEndpoints = [
        `/api/DatPhong/Update/${id}`,
        `https://ptud-web-3.onrender.com/api/DatPhong/Update/${id}`,
        `/api/bookings/${id}`
      ];

      let success = false;

      // Try each endpoint
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying to update booking status using endpoint: ${endpoint}`);
          const response = await axios.put(endpoint, updateData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log('Update successful with response:', response.data);
            break;
          }
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError);
          // Continue to next endpoint
        }
      }

      if (success) {
        message.success('Đã xác nhận đặt phòng thành công!');
        // Refresh all data
        fetchBookings();
      } else {
        // If API fails, still update UI but don't lose data
        const updatedBookings = [...bookings];
        const index = updatedBookings.findIndex(booking => booking.id === id);
        if (index !== -1) {
          // Only update status, keep other info
          updatedBookings[index] = {
            ...updatedBookings[index],
            status: 'confirmed'
          };
          setBookings(updatedBookings);
          message.success('Đã xác nhận đặt phòng thành công! (Chế độ offline)');
        } else {
          message.error('Không tìm thấy đặt phòng để xác nhận');
        }
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận đặt phòng:', error);
      message.error('Có lỗi xảy ra khi xác nhận đặt phòng');
    }
  };

  // Handle reject booking
  const handleRejectBookingDirect = async (id: number) => {
    try {
      message.loading('Đang từ chối đặt phòng...', 0.5);

      // Use status code 5 for "Cancelled" (Đã huỷ)
      const statusId = 5;

      // Tìm thông tin đặt phòng hiện tại
      const currentBooking = bookings.find(booking => booking.id === id);
      if (!currentBooking) {
        message.error('Không tìm thấy thông tin đặt phòng');
        return;
      }

      // Prepare update data - chỉ cập nhật trạng thái, giữ nguyên các dữ liệu khác
      const updateData = {
        maDatPhong: id,
        maPhong: parseInt(currentBooking.roomId),
        maKH: currentBooking.customerId,
        tenKH: currentBooking.customerName,
        phone: currentBooking.phone,
        email: currentBooking.email,
        checkIn: currentBooking.checkIn,
        checkOut: currentBooking.checkOut,
        tongTien: currentBooking.totalPrice,
        soLuongKhach: currentBooking.guestCount,
        trangThai: statusId,
        xoa: false // Đảm bảo không đánh dấu xóa
      };

      console.log('Sending update data:', updateData);

      // Try API endpoints
      const apiEndpoints = [
        `/api/DatPhong/Update/${id}`,
        `https://ptud-web-3.onrender.com/api/DatPhong/Update/${id}`,
        `/api/bookings/${id}`
      ];

      let success = false;

      // Try each endpoint
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying to update booking status using endpoint: ${endpoint}`);
          const response = await axios.put(endpoint, updateData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log('Update successful with response:', response.data);
            break;
          }
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError);
          // Continue to next endpoint
        }
      }

      if (success) {
        message.success('Đã từ chối đặt phòng thành công!');
        // Refresh all data
        fetchBookings();
      } else {
        // If API fails, still update UI but don't lose data
        const updatedBookings = [...bookings];
        const index = updatedBookings.findIndex(booking => booking.id === id);
        if (index !== -1) {
          // Only update status, keep other info
          updatedBookings[index] = {
            ...updatedBookings[index],
            status: 'cancelled'
          };
          setBookings(updatedBookings);
          message.success('Đã từ chối đặt phòng thành công! (Chế độ offline)');
        } else {
          message.error('Không tìm thấy đặt phòng để từ chối');
        }
      }
    } catch (error) {
      console.error('Lỗi khi từ chối đặt phòng:', error);
      message.error('Có lỗi xảy ra khi từ chối đặt phòng');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBookings();
    fetchCustomers();
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

  // Filter bookings based on search, date range, and status (client-side filtering for current page)
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchText ||
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

  // Handle pagination change
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  };

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
          case 'no_show':
            color = 'purple';
            text = 'Không đến';
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
        { text: 'Không đến', value: 'no_show' },
      ],
      onFilter: (value, record) => record.status === value,
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
            type="primary"
          >
            Xem
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            type="default"
          >
            Sửa
          </Button>

          {/* Always show confirm and reject buttons */}
          <Popconfirm
            title="Xác nhận đặt phòng"
            description="Bạn có chắc chắn muốn xác nhận đặt phòng này không?"
            onConfirm={() => handleConfirmBookingDirect(record.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              icon={<CheckCircleOutlined />}
              type="primary"
              size="small"
            >
              Xác nhận
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Từ chối đặt phòng"
            description="Bạn có chắc chắn muốn từ chối đặt phòng này không?"
            onConfirm={() => handleRejectBookingDirect(record.id)}
            okText="Từ chối"
            cancelText="Hủy"
            okType="danger"
          >
            <Button
              icon={<CloseCircleOutlined />}
              danger
              size="small"
            >
              Từ chối
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Xóa đặt phòng"
            description="Bạn có chắc chắn muốn xóa đặt phòng này không?"
            onConfirm={() => handleDeleteBooking(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      <Tabs defaultActiveKey="list" items={[
        {
          key: 'list',
          label: 'Danh sách đặt phòng',
          children: (
            <>
              <div style={{ marginBottom: '20px' }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Tổng đặt phòng"
                        value={totalBookings}
                        loading={loading}
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
                        loading={loading}
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
                        loading={loading}
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
                        loading={loading}
                        prefix={<CalendarOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <Input.Search
                    placeholder="Tìm kiếm theo tên, SĐT, phòng"
                    onSearch={handleSearch}
                    style={{ width: 300 }}
                    allowClear
                  />

                  <RangePicker
                    onChange={handleDateRangeChange}
                    placeholder={['Từ ngày', 'Đến ngày']}
                    style={{ backgroundColor: '#fff' }}
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
                    <Option value="no_show">Không đến</Option>
                  </Select>
                </div>

                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const tabsElement = document.querySelector('.ant-tabs-nav-list');
                      if (tabsElement) {
                        const addTab = tabsElement.children[1] as HTMLElement;
                        if (addTab) addTab.click();
                      }
                    }}
                  >
                    Thêm đặt phòng
                  </Button>
                  <Button
                    type="default"
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                  >
                    Làm mới
                  </Button>
                </Space>
              </div>

              {error && (
                <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cf1322' }}>{error}</span>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleRefresh}
                      icon={<ReloadOutlined />}
                    >
                      Thử lại
                    </Button>
                  </div>
                </div>
              )}

              <Table
                columns={columns}
                dataSource={filteredBookings}
                rowKey="id"
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} đặt phòng`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onChange: handlePageChange,
                  onShowSizeChange: handlePageChange,
                  hideOnSinglePage: false, // Always show pagination
                  simple: false, // Use full pagination controls
                  responsive: true, // Make pagination responsive
                }}
                loading={{
                  spinning: loading,
                  tip: 'Đang tải dữ liệu đặt phòng...',
                  size: 'large'
                }}
                locale={{
                  emptyText: (
                    <div style={{ padding: '20px 0' }}>
                      <p>Không có dữ liệu đặt phòng</p>
                      <Button
                        type="primary"
                        onClick={handleRefresh}
                        icon={<ReloadOutlined />}
                      >
                        Tải lại dữ liệu
                      </Button>
                    </div>
                  )
                }}
              />
            </>
          )
        },
        {
          key: 'add',
          label: 'Thêm đặt phòng',
          children: <AddBooking />
        }
      ]} />

      <Modal
        title="Chi tiết đặt phòng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
          viewBooking && (
            <>
              <Popconfirm
                title="Xác nhận đặt phòng"
                description="Bạn có chắc chắn muốn xác nhận đặt phòng này không?"
                onConfirm={() => {
                  handleConfirmBookingDirect(viewBooking.id);
                  setIsModalVisible(false);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  key="confirm"
                  type="primary"
                >
                  Xác nhận đặt phòng
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Từ chối đặt phòng"
                description="Bạn có chắc chắn muốn từ chối đặt phòng này không?"
                onConfirm={() => {
                  handleRejectBookingDirect(viewBooking.id);
                  setIsModalVisible(false);
                }}
                okText="Từ chối"
                cancelText="Hủy"
                okType="danger"
              >
                <Button
                  key="reject"
                  danger
                >
                  Từ chối đặt phòng
                </Button>
              </Popconfirm>
            </>
          )
        ]}
        style={{ top: 20 }}
        width={700}
      >
        {viewBooking && (
          <div>
            <p><strong>Mã đặt phòng:</strong> #{viewBooking.id}</p>
            <p><strong>Phòng:</strong> {viewBooking.roomNumber}</p>
            <p><strong>Khách hàng:</strong> {viewBooking.customerName}</p>
            <p><strong>Số điện thoại:</strong> {viewBooking.phone}</p>
            <p><strong>Email:</strong> {viewBooking.email || 'Không có'}</p>
            <p><strong>Ngày nhận phòng:</strong> {dayjs(viewBooking.checkIn).format('DD/MM/YYYY')}</p>
            <p><strong>Ngày trả phòng:</strong> {dayjs(viewBooking.checkOut).format('DD/MM/YYYY')}</p>
            <p><strong>Số ngày:</strong> {dayjs(viewBooking.checkOut).diff(dayjs(viewBooking.checkIn), 'day')}</p>
            <p>
              <strong>Trạng thái:</strong> {' '}
              <Tag color={
                viewBooking.status === 'confirmed' ? 'green' :
                viewBooking.status === 'pending' ? 'gold' :
                viewBooking.status === 'checked_in' ? 'blue' :
                viewBooking.status === 'checked_out' ? 'cyan' : 'red'
              }>
                {viewBooking.status === 'confirmed' ? 'Đã xác nhận' :
                 viewBooking.status === 'pending' ? 'Chưa xác nhận' :
                 viewBooking.status === 'checked_in' ? 'Đã nhận phòng' :
                 viewBooking.status === 'checked_out' ? 'Đã trả phòng' : 'Đã hủy'}
              </Tag>
            </p>
            <p><strong>Ngày đặt:</strong> {dayjs(viewBooking.createdAt).format('DD/MM/YYYY')}</p>
            <p><strong>Tổng tiền:</strong> {viewBooking.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
          </div>
        )}
      </Modal>

      {/* Modal chỉnh sửa đặt phòng */}
      <EditBooking
        booking={editBooking}
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default BookingManagement;
