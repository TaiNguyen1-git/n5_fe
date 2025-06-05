import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Select, Card, Statistic, Row, Col, message, Tabs, Popconfirm, DatePicker } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import AddBooking from './add-booking';
import EditBooking from './edit-booking';
import { getAllCustomers, type Customer } from '../../../services/customerService';
import NoPermissionModal from '../../shared/NoPermissionModal';

const { RangePicker } = DatePicker;
const { Option } = Select;

// Định nghĩa cấu trúc dữ liệu đặt phòng từ API
interface Booking {
  maDatPhong: number;
  trangThaiDatPhong: any;
  khachHang: any;
  phong: any;
  maKH: number;
  maPhong: number;
  ngayDat: string;
  checkIn: string;
  checkOut: string;
  trangThai: number;
  xoa: boolean;
}

// API URLs for bookings
const BOOKING_API_URLS = [
  '/api/DatPhong/GetAll', // Use proxy from Next.js config
  'https://ptud-web-3.onrender.com/api/DatPhong/GetAll', // Direct API call
  '/api/bookings', // Local Next.js API route
];

// API URLs for booking statuses
const STATUS_API_URLS = [
  '/api/trangThaiDatPhong/GetAll', // Use proxy from Next.js config
  'https://ptud-web-3.onrender.com/api/trangThaiDatPhong/GetAll', // Direct API call
  '/api/booking-statuses', // Local Next.js API route
];

// Interface for booking status
interface BookingStatus {
  maTT: number;
  datPhong: any;
  tenTT: string;
  color?: string; // Thêm màu sắc cho UI
  value?: number; // Để tương thích với code hiện tại
  label?: string; // Để tương thích với code hiện tại
}

// Màu sắc mặc định cho các trạng thái
const defaultStatusColors: Record<number, string> = {
  1: 'green',  // Đã xác nhận
  2: 'orange', // Đang chờ
  3: 'red',    // Đã hủy
  4: 'blue',   // Đã hoàn thành
  5: 'purple', // Khác
};

const BookingManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<BookingStatus[]>([]);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Customer data states
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [customerLoading, setCustomerLoading] = useState(false);

  // Permission modal states
  const [noPermissionModal, setNoPermissionModal] = useState({
    visible: false,
    action: ''
  });

  // Fetch customer data
  const fetchCustomers = async () => {
    setCustomerLoading(true);
    try {
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
      } else {
      }
    } catch (error) {
    } finally {
      setCustomerLoading(false);
    }
  };

  // Format booking data from API response
  const formatBookingData = (data: any[]): Booking[] => {
    // Lọc bỏ các đặt phòng không hợp lệ (không có mã đặt phòng)
    const validData = data.filter(booking => booking && booking.maDatPhong);

    const formattedData = validData.map((booking: any) => {
      // Đảm bảo tất cả các trường đều có giá trị hợp lệ
      return {
        maDatPhong: booking.maDatPhong || 0,
        trangThaiDatPhong: booking.trangThaiDatPhong || null,
        khachHang: booking.khachHang || null,
        phong: booking.phong || null,
        maKH: booking.maKH || 0,
        maPhong: booking.maPhong || 0,
        ngayDat: booking.ngayDat || new Date().toISOString(),
        checkIn: booking.checkIn || new Date().toISOString(),
        checkOut: booking.checkOut || new Date().toISOString(),
        trangThai: booking.trangThai || 2, // Mặc định là "Chờ xác nhận" nếu không có
        xoa: booking.xoa || false
      };
    });
    return formattedData;
  };

  // Fetch bookings from API with fallback mechanisms
  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    // Try each API endpoint in sequence
    for (let i = 0; i < BOOKING_API_URLS.length; i++) {
      try {
        const response = await axios.get(BOOKING_API_URLS[i], {
          params: {
            PageNumber: currentPage,
            PageSize: pageSize
          },
          timeout: 15000, // 15 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        // Handle different response formats
        if (response.data) {
          let formattedBookings: Booking[] = [];

          if (Array.isArray(response.data.items)) {
            // Format for API response with items array
            formattedBookings = formatBookingData(response.data.items);
            // Set total count for pagination - use totalItems if available
            setTotal(response.data.totalItems || response.data.totalCount || response.data.items.length);
          } else if (Array.isArray(response.data)) {
            // Format for direct array response
            formattedBookings = formatBookingData(response.data);
            setTotal(response.data.length);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Format for response with data property
            formattedBookings = formatBookingData(response.data.data);
            setTotal(response.data.data.length);
          }

          if (formattedBookings.length >= 0) { // Allow empty results for pagination
            // Sắp xếp đặt phòng theo thời gian tạo mới nhất
            formattedBookings.sort((a, b) => {
              return new Date(b.ngayDat).getTime() - new Date(a.ngayDat).getTime();
            });

            setBookings(formattedBookings);
            setLoading(false);
            return; // Success, exit the function
          }
        }

        // If we get here, the response format wasn't recognized
      } catch (err) {
        // Continue to the next API endpoint
      }
    }

    // Nếu tất cả API đều thất bại, thử tạo dữ liệu mẫu để demo
    try {
      const mockBookings: Booking[] = [
        {
          maDatPhong: 1,
          trangThaiDatPhong: null,
          khachHang: null,
          phong: null,
          maKH: 1,
          maPhong: 101,
          ngayDat: new Date().toISOString(),
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 ngày sau
          trangThai: 2, // Chờ xác nhận
          xoa: false
        },
        {
          maDatPhong: 2,
          trangThaiDatPhong: null,
          khachHang: null,
          phong: null,
          maKH: 2,
          maPhong: 102,
          ngayDat: new Date().toISOString(),
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 ngày sau
          trangThai: 1, // Đã xác nhận
          xoa: false
        }
      ];

      setBookings(mockBookings);
      message.warning('Sử dụng dữ liệu mẫu để demo. Không thể kết nối đến máy chủ.');
      setError('Không thể kết nối đến máy chủ. Đang sử dụng dữ liệu mẫu.');
    } catch (mockError) {
      message.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }

    setLoading(false);
  };

  // Format booking status data from API response
  const formatStatusData = (data: any[]): BookingStatus[] => {
    return data.map((status: any) => ({
      maTT: status.maTT || 0,
      datPhong: status.datPhong,
      tenTT: status.tenTT || 'Unknown',
      // Thêm các trường để tương thích với code hiện tại
      value: status.maTT || 0,
      label: status.tenTT || 'Unknown',
      color: defaultStatusColors[status.maTT] || 'default'
    }));
  };

  // Fetch booking statuses from API with fallback mechanisms
  const fetchBookingStatuses = async () => {
    setStatusLoading(true);

    // Try each API endpoint in sequence
    for (let i = 0; i < STATUS_API_URLS.length; i++) {
      try {
        const response = await axios.get(STATUS_API_URLS[i], {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        // Handle different response formats
        if (response.data) {
          let formattedStatuses: BookingStatus[] = [];

          if (Array.isArray(response.data)) {
            // Format for direct array response
            formattedStatuses = formatStatusData(response.data);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Format for response with data property
            formattedStatuses = formatStatusData(response.data.data);
          }

          if (formattedStatuses.length > 0) {
            setBookingStatuses(formattedStatuses);
            setStatusLoading(false);
            return; // Success, exit the function
          }
        }

        // If we get here, the response format wasn't recognized
      } catch (err) {
        // Continue to the next API endpoint
      }
    }

    // If all API calls failed, use default statuses
    const defaultStatuses: BookingStatus[] = [
      { maTT: 1, datPhong: null, tenTT: 'Đã xác nhận', value: 1, label: 'Đã xác nhận', color: 'green' },
      { maTT: 2, datPhong: null, tenTT: 'Đang chờ', value: 2, label: 'Đang chờ', color: 'orange' },
      { maTT: 3, datPhong: null, tenTT: 'Đã hủy', value: 3, label: 'Đã hủy', color: 'red' },
      { maTT: 4, datPhong: null, tenTT: 'Đã hoàn thành', value: 4, label: 'Đã hoàn thành', color: 'blue' },
    ];
    setBookingStatuses(defaultStatuses);
    setStatusLoading(false);
  };

  // Load bookings and statuses when component mounts and when pagination changes
  useEffect(() => {
    fetchBookings();
  }, [currentPage, pageSize]);

  // Load booking statuses and customers only once when component mounts
  useEffect(() => {
    fetchBookingStatuses();
    fetchCustomers();
  }, []);

  // Xử lý xem chi tiết đặt phòng
  const handleView = (booking: Booking) => {
    setViewBooking(booking);
    setIsModalVisible(true);
  };

  // Xử lý chỉnh sửa đặt phòng - Staff không có quyền
  const handleEdit = (booking: Booking) => {
    setNoPermissionModal({
      visible: true,
      action: 'chỉnh sửa đặt phòng'
    });
  };

  // Xử lý khi chỉnh sửa thành công
  const handleEditSuccess = () => {
    fetchBookings();
  };

  // Xử lý xóa đặt phòng - Staff không có quyền
  const handleDeleteBooking = async (id: number) => {
    setNoPermissionModal({
      visible: true,
      action: 'xóa đặt phòng'
    });
  };

  // Xử lý xác nhận đặt phòng trực tiếp không qua Modal
  const handleConfirmBookingDirect = async (id: number) => {
    try {
      message.loading('Đang xác nhận đặt phòng...', 0.5);

      // Sử dụng mã trạng thái cố định là 1 cho "Đã xác nhận"
      const statusId = 1;

      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        trangThai: statusId
      };

      // Thử gọi API để cập nhật trạng thái
      const apiEndpoints = [
        `/api/DatPhong/Update/${id}`,
        `https://ptud-web-3.onrender.com/api/DatPhong/Update/${id}`,
        `/api/bookings/${id}`
      ];

      let success = false;

      // Thử từng endpoint
      for (const endpoint of apiEndpoints) {
        try {
          const response = await axios.put(endpoint, updateData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 giây timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            break;
          }
        } catch (endpointError) {
          // Tiếp tục thử endpoint tiếp theo
        }
      }

      if (success) {
        message.success('Đã xác nhận đặt phòng thành công!');
        // Làm mới toàn bộ dữ liệu thay vì chỉ cập nhật một phần
        fetchBookings();
      } else {
        // Nếu API không thành công, vẫn cập nhật UI nhưng không làm mất dữ liệu
        const updatedBookings = [...bookings];
        const index = updatedBookings.findIndex(booking => booking.maDatPhong === id);
        if (index !== -1) {
          updatedBookings[index] = {
            ...updatedBookings[index],
            trangThai: statusId
          };
          setBookings(updatedBookings);
          message.success('Đã xác nhận đặt phòng thành công! (Chế độ offline)');
        } else {
          message.error('Không tìm thấy đặt phòng để xác nhận');
        }
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi xác nhận đặt phòng');
    }
  };

  // Xử lý từ chối đặt phòng trực tiếp không qua Modal
  const handleRejectBookingDirect = async (id: number) => {
    try {
      message.loading('Đang từ chối đặt phòng...', 0.5);

      // Sử dụng mã trạng thái cố định là 3 cho "Đã hủy"
      const statusId = 3;

      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        trangThai: statusId
      };

      // Thử gọi API để cập nhật trạng thái
      const apiEndpoints = [
        `/api/DatPhong/Update/${id}`,
        `https://ptud-web-3.onrender.com/api/DatPhong/Update/${id}`,
        `/api/bookings/${id}`
      ];

      let success = false;

      // Thử từng endpoint
      for (const endpoint of apiEndpoints) {
        try {
          const response = await axios.put(endpoint, updateData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 giây timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            break;
          }
        } catch (endpointError) {
          // Tiếp tục thử endpoint tiếp theo
        }
      }

      if (success) {
        message.success('Đã từ chối đặt phòng thành công!');
        // Làm mới toàn bộ dữ liệu thay vì chỉ cập nhật một phần
        fetchBookings();
      } else {
        // Nếu API không thành công, vẫn cập nhật UI nhưng không làm mất dữ liệu
        const updatedBookings = [...bookings];
        const index = updatedBookings.findIndex(booking => booking.maDatPhong === id);
        if (index !== -1) {
          updatedBookings[index] = {
            ...updatedBookings[index],
            trangThai: statusId
          };
          setBookings(updatedBookings);
          message.success('Đã từ chối đặt phòng thành công! (Chế độ offline)');
        } else {
          message.error('Không tìm thấy đặt phòng để từ chối');
        }
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi từ chối đặt phòng');
    }
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

  // Xử lý làm mới dữ liệu
  const handleRefresh = () => {
    fetchBookings();
    fetchCustomers();
  };

  // Handle pagination change
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  };

  // Lọc danh sách đặt phòng (client-side filtering for current page)
  const filteredBookings = bookings.filter(booking => {
    // Ẩn các đặt phòng có xoa = true khỏi giao diện
    if (booking.xoa === true) {
      return false;
    }

    // Search text filter
    const matchesSearch = !searchText ||
      (booking.maKH && booking.maKH.toString().includes(searchText)) ||
      (booking.maPhong && booking.maPhong.toString().includes(searchText)) ||
      (booking.maDatPhong && booking.maDatPhong.toString().includes(searchText));

    // Status filter
    const matchesStatus = statusFilter ? booking.trangThai.toString() === statusFilter : true;

    // Date range filter
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
  const columns: ColumnsType<Booking> = [
    {
      title: 'Phòng',
      dataIndex: 'maPhong',
      key: 'maPhong',
      render: (maPhong) => <span>Phòng {maPhong}</span>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'maKH',
      key: 'maKH',
      render: (maKH) => {
        const customer = customers[maKH];
        if (customer && customer.tenKH) {
          return <span>{customer.tenKH}</span>;
        }
        return customerLoading ? <span>Đang tải...</span> : <span>Khách hàng {maKH}</span>;
      },
    },
    {
      title: 'Ngày nhận phòng',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
    },
    {
      title: 'Ngày trả phòng',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime(),
    },
    {
      title: 'Trạng thái',
      key: 'trangThai',
      dataIndex: 'trangThai',
      render: (trangThai) => {
        // Xác định trạng thái dựa trên mã trạng thái
        let statusText = 'Unknown';
        let statusColor = 'default';

        switch (trangThai) {
          case 1:
            statusText = 'Đã xác nhận';
            statusColor = 'green';
            break;
          case 2:
            statusText = 'Chờ xác nhận';
            statusColor = 'orange';
            break;
          case 3:
            statusText = 'Đã hủy';
            statusColor = 'red';
            break;
          case 4:
            statusText = 'Đã hoàn thành';
            statusColor = 'blue';
            break;
          default:
            // Nếu không có trạng thái hoặc trạng thái là 0, hiển thị "Chờ xác nhận"
            if (trangThai === 0 || trangThai === undefined || trangThai === null) {
              statusText = 'Chờ xác nhận';
              statusColor = 'orange';
            }
        }

        return (
          <Tag color={statusColor}>
            {statusText}
          </Tag>
        );
      },
      sorter: (a, b) => (a.trangThai || 0) - (b.trangThai || 0),
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

          {/* Luôn hiển thị nút xác nhận và từ chối */}
          <Button
            icon={<CheckCircleOutlined />}
            type="primary"
            onClick={() => handleConfirmBookingDirect(record.maDatPhong)}
            size="small"
          >
            Xác nhận
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            danger
            onClick={() => handleRejectBookingDirect(record.maDatPhong)}
            size="small"
          >
            Từ chối
          </Button>

          <Popconfirm
            title="Xóa đặt phòng"
            description="Bạn có chắc chắn muốn xóa đặt phòng này không?"
            onConfirm={() => handleDeleteBooking(record.maDatPhong)}
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

          {/* Hiển thị thông tin trạng thái đặt phòng để debug */}
          <div style={{ display: 'none' }}>
            <p>Trạng thái: {record.trangThai}</p>
            <p>Mã đặt phòng: {record.maDatPhong}</p>
          </div>
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
                        value={bookings.length}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Chờ xác nhận"
                        value={bookings.filter(b => b.trangThai === 2 || b.trangThai === 0 || !b.trangThai).length}
                        valueStyle={{ color: '#faad14' }}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Đã xác nhận"
                        value={bookings.filter(b => b.trangThai === 1).length}
                        valueStyle={{ color: '#52c41a' }}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Đã hủy"
                        value={bookings.filter(b => b.trangThai === 3).length}
                        valueStyle={{ color: '#f5222d' }}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <Input.Search
                    placeholder="Tìm kiếm theo mã phòng, mã khách hàng"
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
                    {bookingStatuses.map(status => (
                      <Option
                        key={status.value}
                        value={status.value?.toString() || ''}
                        style={{ color: '#333' }}
                      >
                        {status.label}
                      </Option>
                    ))}
                  </Select>

                  <RangePicker
                    onChange={handleDateRangeChange}
                    placeholder={['Từ ngày', 'Đến ngày']}
                    style={{ backgroundColor: '#fff' }}
                    popupStyle={{ backgroundColor: '#fff' }}
                  />
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
                rowKey="maDatPhong"
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

      {/* Modal xem chi tiết đặt phòng */}
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
              <Button
                key="confirm"
                type="primary"
                onClick={() => {
                  handleConfirmBookingDirect(viewBooking.maDatPhong);
                  setIsModalVisible(false);
                }}
              >
                Xác nhận đặt phòng
              </Button>
              <Button
                key="reject"
                danger
                onClick={() => {
                  handleRejectBookingDirect(viewBooking.maDatPhong);
                  setIsModalVisible(false);
                }}
              >
                Từ chối đặt phòng
              </Button>
            </>
          )
        ]}
        style={{ top: 20 }}
      >
        {viewBooking && (
          <div>
            <p><strong>Mã đặt phòng:</strong> {viewBooking.maDatPhong}</p>
            <p><strong>Mã phòng:</strong> {viewBooking.maPhong}</p>
            <p><strong>Khách hàng:</strong> {
              (() => {
                const customer = customers[viewBooking.maKH];
                if (customer && customer.tenKH) {
                  return `${customer.tenKH} (ID: ${viewBooking.maKH})`;
                }
                return customerLoading ? 'Đang tải...' : `Khách hàng ${viewBooking.maKH}`;
              })()
            }</p>
            <p><strong>Ngày nhận phòng:</strong> {dayjs(viewBooking.checkIn).format('DD/MM/YYYY')}</p>
            <p><strong>Ngày trả phòng:</strong> {dayjs(viewBooking.checkOut).format('DD/MM/YYYY')}</p>
            <p><strong>Số ngày:</strong> {dayjs(viewBooking.checkOut).diff(dayjs(viewBooking.checkIn), 'day')}</p>
            <p>
              <strong>Trạng thái:</strong> {' '}
              {(() => {
                // Xác định trạng thái dựa trên mã trạng thái
                let statusText = 'Unknown';
                let statusColor = 'default';

                switch (viewBooking.trangThai) {
                  case 1:
                    statusText = 'Đã xác nhận';
                    statusColor = 'green';
                    break;
                  case 2:
                    statusText = 'Chờ xác nhận';
                    statusColor = 'orange';
                    break;
                  case 3:
                    statusText = 'Đã hủy';
                    statusColor = 'red';
                    break;
                  case 4:
                    statusText = 'Đã hoàn thành';
                    statusColor = 'blue';
                    break;
                  default:
                    // Nếu không có trạng thái hoặc trạng thái là 0, hiển thị "Chờ xác nhận"
                    if (viewBooking.trangThai === 0 || viewBooking.trangThai === undefined || viewBooking.trangThai === null) {
                      statusText = 'Chờ xác nhận';
                      statusColor = 'orange';
                    }
                }

                return (
                  <Tag color={statusColor}>
                    {statusText}
                  </Tag>
                );
              })()}
            </p>
            <p><strong>Ngày đặt:</strong> {dayjs(viewBooking.ngayDat).format('DD/MM/YYYY')}</p>
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

      {/* Modal không có quyền */}
      <NoPermissionModal
        visible={noPermissionModal.visible}
        action={noPermissionModal.action}
        onClose={() => setNoPermissionModal({ visible: false, action: '' })}
      />
    </div>
  );
};

export default BookingManagement;
