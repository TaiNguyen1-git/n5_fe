import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Button, Table, Tag, DatePicker, Space, message, Tabs, Spin, Drawer } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  HomeOutlined,
  CalendarOutlined,
  ClearOutlined,
  MenuOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiMethods } from '../../utils/apiUtils';
import ResponsiveTable from './ResponsiveTable';
import SimpleExportButton from './SimpleExportButton';
import { ExportColumn } from '../../services/exportService';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Interfaces
interface Room {
  maPhong: number;
  tenPhong: string;
  soPhong: string;
  loaiPhong: {
    maLoai: number;
    tenLoai: string;
    giaPhong: number;
  };
  trangThai: number;
  xoa: boolean;
}

interface Customer {
  maKH: number;
  tenKH: string;
  email: string;
  phone: string;
  maVaiTro: number;
  xoa: boolean;
}

interface Booking {
  maDatPhong: number;
  maKH: number;
  maPhong: number;
  ngayDat: string;
  checkIn: string;
  checkOut: string;
  trangThai: number;
  xoa: boolean;
  khachHang?: Customer;
  phong?: Room;
}

interface RoomType {
  maLoai: number;
  tenLoai: string;
  giaPhong: number;
}

interface AdvancedSearchProps {
  showTitle?: boolean;
}

// Room status mapping
const ROOM_STATUS_CONFIG = {
  1: { label: 'Phòng trống', color: 'green' },
  2: { label: 'Đã đặt', color: 'blue' },
  3: { label: 'Có khách', color: 'orange' },
  4: { label: 'Trả phòng', color: 'purple' },
  5: { label: 'Đang dọn', color: 'red' }
};

// Booking status mapping
const BOOKING_STATUS_CONFIG = {
  1: { label: 'Chờ xác nhận', color: 'orange' },
  2: { label: 'Đã xác nhận', color: 'blue' },
  3: { label: 'Đã nhận phòng', color: 'green' },
  4: { label: 'Đã trả phòng', color: 'purple' },
  5: { label: 'Đã huỷ', color: 'red' },
  6: { label: 'Không đến', color: 'gray' }
};

const AdvancedSearchDashboard: React.FC<AdvancedSearchProps> = ({
  showTitle = true
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms');
  const [isMobile, setIsMobile] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // Search states for rooms
  const [roomSearchText, setRoomSearchText] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<number | null>(null);
  const [roomPriceRange, setRoomPriceRange] = useState<[number, number]>([0, 5000000]);

  // Search states for customers
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [customerEmailSearch, setCustomerEmailSearch] = useState('');
  const [customerPhoneSearch, setCustomerPhoneSearch] = useState('');

  // Search states for bookings
  const [bookingSearchText, setBookingSearchText] = useState('');
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<number | null>(null);
  const [bookingDateRange, setBookingDateRange] = useState<any>(null);
  const [checkInDateRange, setCheckInDateRange] = useState<any>(null);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, customersRes, bookingsRes, roomTypesRes] = await Promise.all([
        apiMethods.get('Phong/GetAll?PageNumber=1&PageSize=1000'),
        apiMethods.get('KhachHang/GetAll?PageNumber=1&PageSize=1000'),
        apiMethods.get('DatPhong/GetAll?PageNumber=1&PageSize=1000'),
        apiMethods.get('LoaiPhong/GetAll')
      ]);

      // Process rooms data
      if (roomsRes.success && roomsRes.data) {
        const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data.items || [];
        setRooms(roomsData.filter((room: Room) => !room.xoa));
      }

      // Process customers data
      if (customersRes.success && customersRes.data) {
        const customersData = Array.isArray(customersRes.data) ? customersRes.data : customersRes.data.items || [];
        setCustomers(customersData.filter((customer: Customer) => !customer.xoa));
      }

      // Process bookings data
      if (bookingsRes.success && bookingsRes.data) {
        const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.items || [];
        setBookings(bookingsData.filter((booking: Booking) => !booking.xoa));
      }

      // Process room types data
      if (roomTypesRes.success && roomTypesRes.data) {
        const roomTypesData = Array.isArray(roomTypesRes.data) ? roomTypesRes.data : roomTypesRes.data.items || [];
        setRoomTypes(roomTypesData);
      }

    } catch (error) {
      message.error('Không thể tải dữ liệu tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Filter rooms based on search criteria
  const getFilteredRooms = () => {
    return rooms.filter(room => {
      // Text search
      const matchesText = !roomSearchText ||
        room.tenPhong?.toLowerCase().includes(roomSearchText.toLowerCase()) ||
        room.soPhong?.toLowerCase().includes(roomSearchText.toLowerCase());

      // Room type filter
      const matchesType = !selectedRoomType || room.loaiPhong?.maLoai === selectedRoomType;

      // Room status filter
      const matchesStatus = selectedRoomStatus === null || room.trangThai === selectedRoomStatus;

      // Price range filter
      const roomPrice = room.loaiPhong?.giaPhong || 0;
      const matchesPrice = roomPrice >= roomPriceRange[0] && roomPrice <= roomPriceRange[1];

      return matchesText && matchesType && matchesStatus && matchesPrice;
    });
  };

  // Filter customers based on search criteria
  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const matchesName = !customerSearchText ||
        customer.tenKH?.toLowerCase().includes(customerSearchText.toLowerCase());

      const matchesEmail = !customerEmailSearch ||
        customer.email?.toLowerCase().includes(customerEmailSearch.toLowerCase());

      const matchesPhone = !customerPhoneSearch ||
        customer.phone?.includes(customerPhoneSearch);

      return matchesName && matchesEmail && matchesPhone;
    });
  };

  // Filter bookings based on search criteria
  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      // Text search (customer name or room number)
      const customerName = customers.find(c => c.maKH === booking.maKH)?.tenKH || '';
      const roomNumber = rooms.find(r => r.maPhong === booking.maPhong)?.soPhong || '';
      const matchesText = !bookingSearchText ||
        customerName.toLowerCase().includes(bookingSearchText.toLowerCase()) ||
        roomNumber.toLowerCase().includes(bookingSearchText.toLowerCase()) ||
        booking.maDatPhong.toString().includes(bookingSearchText);

      // Booking status filter
      const matchesStatus = selectedBookingStatus === null || booking.trangThai === selectedBookingStatus;

      // Booking date range filter
      const matchesBookingDate = !bookingDateRange ||
        (dayjs(booking.ngayDat).isAfter(dayjs(bookingDateRange[0])) &&
         dayjs(booking.ngayDat).isBefore(dayjs(bookingDateRange[1])));

      // Check-in date range filter
      const matchesCheckInDate = !checkInDateRange ||
        (dayjs(booking.checkIn).isAfter(dayjs(checkInDateRange[0])) &&
         dayjs(booking.checkIn).isBefore(dayjs(checkInDateRange[1])));

      return matchesText && matchesStatus && matchesBookingDate && matchesCheckInDate;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setRoomSearchText('');
    setSelectedRoomType(null);
    setSelectedRoomStatus(null);
    setRoomPriceRange([0, 5000000]);
    setCustomerSearchText('');
    setCustomerEmailSearch('');
    setCustomerPhoneSearch('');
    setBookingSearchText('');
    setSelectedBookingStatus(null);
    setBookingDateRange(null);
    setCheckInDateRange(null);
  };

  // Get export data and columns for current tab
  const getExportConfig = () => {
    switch (activeTab) {
      case 'rooms':
        return {
          data: getFilteredRooms(),
          columns: [
            { key: 'soPhong', title: 'Số phòng', dataIndex: 'soPhong' },
            { key: 'tenPhong', title: 'Tên phòng', dataIndex: 'tenPhong' },
            { key: 'loaiPhong', title: 'Loại phòng', dataIndex: ['loaiPhong', 'tenLoai'] },
            { key: 'giaPhong', title: 'Giá phòng (VNĐ)', dataIndex: ['loaiPhong', 'giaPhong'], render: (value: number) => value?.toLocaleString('vi-VN') || '0' },
            { key: 'trangThai', title: 'Trạng thái', dataIndex: 'trangThai', render: (status: number) => ROOM_STATUS_CONFIG[status as keyof typeof ROOM_STATUS_CONFIG]?.label || 'Không xác định' }
          ] as ExportColumn[],
          filename: `danh-sach-phong-${dayjs().format('YYYY-MM-DD')}`,
          title: 'DANH SÁCH PHÒNG'
        };
      case 'customers':
        return {
          data: getFilteredCustomers(),
          columns: [
            { key: 'tenKH', title: 'Tên khách hàng', dataIndex: 'tenKH' },
            { key: 'email', title: 'Email', dataIndex: 'email' },
            { key: 'phone', title: 'Số điện thoại', dataIndex: 'phone' },
            { key: 'maVaiTro', title: 'Vai trò', dataIndex: 'maVaiTro', render: (role: number) => role === 3 ? 'Khách hàng' : 'Khác' }
          ] as ExportColumn[],
          filename: `danh-sach-khach-hang-${dayjs().format('YYYY-MM-DD')}`,
          title: 'DANH SÁCH KHÁCH HÀNG'
        };
      case 'bookings':
        return {
          data: getFilteredBookings(),
          columns: [
            { key: 'maDatPhong', title: 'Mã đặt phòng', dataIndex: 'maDatPhong' },
            { key: 'tenKH', title: 'Khách hàng', dataIndex: ['khachHang', 'tenKH'] },
            { key: 'soPhong', title: 'Số phòng', dataIndex: ['phong', 'soPhong'] },
            { key: 'ngayDat', title: 'Ngày đặt', dataIndex: 'ngayDat', render: (date: string) => dayjs(date).format('DD/MM/YYYY') },
            { key: 'checkIn', title: 'Ngày nhận phòng', dataIndex: 'checkIn', render: (date: string) => dayjs(date).format('DD/MM/YYYY') },
            { key: 'checkOut', title: 'Ngày trả phòng', dataIndex: 'checkOut', render: (date: string) => dayjs(date).format('DD/MM/YYYY') },
            { key: 'trangThai', title: 'Trạng thái', dataIndex: 'trangThai', render: (status: number) => BOOKING_STATUS_CONFIG[status as keyof typeof BOOKING_STATUS_CONFIG]?.label || 'Không xác định' }
          ] as ExportColumn[],
          filename: `danh-sach-dat-phong-${dayjs().format('YYYY-MM-DD')}`,
          title: 'DANH SÁCH ĐẶT PHÒNG'
        };
      default:
        return {
          data: [],
          columns: [],
          filename: 'export',
          title: 'Dữ liệu xuất'
        };
    }
  };

  // Mobile filter drawer content
  const renderMobileFilters = () => {
    switch (activeTab) {
      case 'rooms':
        return (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              placeholder="Tìm theo tên phòng, số phòng..."
              prefix={<SearchOutlined />}
              value={roomSearchText}
              onChange={(e) => setRoomSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Loại phòng"
              style={{ width: '100%' }}
              value={selectedRoomType}
              onChange={setSelectedRoomType}
              allowClear
            >
              {roomTypes.map(type => (
                <Option key={type.maLoai} value={type.maLoai}>
                  {type.tenLoai} - {type.giaPhong.toLocaleString('vi-VN')} VNĐ
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Trạng thái phòng"
              style={{ width: '100%' }}
              value={selectedRoomStatus}
              onChange={setSelectedRoomStatus}
              allowClear
            >
              {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => (
                <Option key={status} value={parseInt(status)}>
                  <Tag color={config.color}>{config.label}</Tag>
                </Option>
              ))}
            </Select>
          </Space>
        );
      case 'customers':
        return (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              placeholder="Tìm theo tên khách hàng..."
              prefix={<SearchOutlined />}
              value={customerSearchText}
              onChange={(e) => setCustomerSearchText(e.target.value)}
              allowClear
            />
            <Input
              placeholder="Tìm theo email..."
              prefix={<SearchOutlined />}
              value={customerEmailSearch}
              onChange={(e) => setCustomerEmailSearch(e.target.value)}
              allowClear
            />
            <Input
              placeholder="Tìm theo số điện thoại..."
              prefix={<SearchOutlined />}
              value={customerPhoneSearch}
              onChange={(e) => setCustomerPhoneSearch(e.target.value)}
              allowClear
            />
          </Space>
        );
      case 'bookings':
        return (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              placeholder="Tìm theo tên khách, số phòng, mã đặt phòng..."
              prefix={<SearchOutlined />}
              value={bookingSearchText}
              onChange={(e) => setBookingSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Trạng thái đặt phòng"
              style={{ width: '100%' }}
              value={selectedBookingStatus}
              onChange={setSelectedBookingStatus}
              allowClear
            >
              {Object.entries(BOOKING_STATUS_CONFIG).map(([status, config]) => (
                <Option key={status} value={parseInt(status)}>
                  <Tag color={config.color}>{config.label}</Tag>
                </Option>
              ))}
            </Select>
          </Space>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-mobile">
      {showTitle && (
        <div style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 16 : 0
        }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 8, fontSize: isMobile ? '20px' : '24px' }}>
              Tìm kiếm & Lọc nâng cao
            </h2>
            <p style={{ margin: 0, color: '#666', fontSize: isMobile ? '14px' : '16px' }}>
              Tìm kiếm đa tiêu chí cho phòng, khách hàng và đặt phòng
            </p>
          </div>
          <Space direction={isMobile ? 'horizontal' : 'horizontal'} wrap>
            {isMobile && (
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
                className="touch-target"
              >
                Bộ lọc
              </Button>
            )}
            <Button
              icon={<ClearOutlined />}
              onClick={clearAllFilters}
              className={isMobile ? "touch-target" : ""}
              size={isMobile ? "middle" : "middle"}
            >
              {isMobile ? "" : "Xóa bộ lọc"}
            </Button>
            <SimpleExportButton
              {...getExportConfig()}
              loading={loading}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
              className={isMobile ? "touch-target" : ""}
              size={isMobile ? "middle" : "middle"}
            >
              {isMobile ? "" : "Làm mới"}
            </Button>
          </Space>
        </div>
      )}

      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={isMobile ? "small" : "large"}
          tabPosition="top"
        >
          <TabPane
            tab={
              <span>
                <HomeOutlined />
                {!isMobile && " Tìm kiếm Phòng"}
              </span>
            }
            key="rooms"
          >
            {/* Room Search Filters - Desktop Only */}
            {!isMobile && (
              <Card title="Bộ lọc tìm kiếm phòng" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Input
                      placeholder="Tìm theo tên phòng, số phòng..."
                      prefix={<SearchOutlined />}
                      value={roomSearchText}
                      onChange={(e) => setRoomSearchText(e.target.value)}
                      allowClear
                    />
                  </Col>
                  <Col span={6}>
                    <Select
                      placeholder="Loại phòng"
                      style={{ width: '100%' }}
                      value={selectedRoomType}
                      onChange={setSelectedRoomType}
                      allowClear
                    >
                      {roomTypes.map(type => (
                        <Option key={type.maLoai} value={type.maLoai}>
                          {type.tenLoai} - {type.giaPhong.toLocaleString('vi-VN')} VNĐ
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      placeholder="Trạng thái phòng"
                      style={{ width: '100%' }}
                      value={selectedRoomStatus}
                      onChange={setSelectedRoomStatus}
                      allowClear
                    >
                      {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => (
                        <Option key={status} value={parseInt(status)}>
                          <Tag color={config.color}>{config.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <span>Giá: {roomPriceRange[0].toLocaleString('vi-VN')} - {roomPriceRange[1].toLocaleString('vi-VN')} VNĐ</span>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Room Results */}
            <ResponsiveTable
              dataSource={getFilteredRooms()}
              rowKey="maPhong"
              pagination={{ pageSize: 10 }}
              loading={loading}
              title={`Kết quả tìm kiếm (${getFilteredRooms().length} phòng)`}
              columns={[
                {
                  title: 'Số phòng',
                  dataIndex: 'soPhong',
                  key: 'soPhong',
                  render: (text: string) => <strong>{text}</strong>
                },
                {
                  title: 'Tên phòng',
                  dataIndex: 'tenPhong',
                  key: 'tenPhong'
                },
                {
                  title: 'Loại phòng',
                  dataIndex: ['loaiPhong', 'tenLoai'],
                  key: 'roomType'
                },
                {
                  title: 'Giá phòng',
                  dataIndex: ['loaiPhong', 'giaPhong'],
                  key: 'price',
                  render: (price: number) => `${price?.toLocaleString('vi-VN')} VNĐ`
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'trangThai',
                  key: 'status',
                  render: (status: number) => {
                    const config = ROOM_STATUS_CONFIG[status as keyof typeof ROOM_STATUS_CONFIG];
                    return <Tag color={config?.color}>{config?.label}</Tag>;
                  }
                }
              ]}
              mobileCardRender={(record: Room) => (
                <Card size="small" style={{ marginBottom: 12 }} hoverable>
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Số phòng</span>
                        <strong style={{ fontSize: '16px' }}>{record.soPhong}</strong>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Trạng thái</span>
                        <Tag color={ROOM_STATUS_CONFIG[record.trangThai as keyof typeof ROOM_STATUS_CONFIG]?.color}>
                          {ROOM_STATUS_CONFIG[record.trangThai as keyof typeof ROOM_STATUS_CONFIG]?.label}
                        </Tag>
                      </Space>
                    </Col>
                    <Col span={24}>
                      <Space direction="vertical" size={0}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Tên phòng</span>
                        <span>{record.tenPhong}</span>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Loại phòng</span>
                        <span>{record.loaiPhong?.tenLoai}</span>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Giá phòng</span>
                        <strong>{record.loaiPhong?.giaPhong?.toLocaleString('vi-VN')} VNĐ</strong>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              )}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                {!isMobile && " Tìm kiếm Khách hàng"}
              </span>
            }
            key="customers"
          >
            {/* Customer Search Filters - Desktop Only */}
            {!isMobile && (
              <Card title="Bộ lọc tìm kiếm khách hàng" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Input
                      placeholder="Tìm theo tên khách hàng..."
                      prefix={<SearchOutlined />}
                      value={customerSearchText}
                      onChange={(e) => setCustomerSearchText(e.target.value)}
                      allowClear
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      placeholder="Tìm theo email..."
                      prefix={<SearchOutlined />}
                      value={customerEmailSearch}
                      onChange={(e) => setCustomerEmailSearch(e.target.value)}
                      allowClear
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      placeholder="Tìm theo số điện thoại..."
                      prefix={<SearchOutlined />}
                      value={customerPhoneSearch}
                      onChange={(e) => setCustomerPhoneSearch(e.target.value)}
                      allowClear
                    />
                  </Col>
                </Row>
              </Card>
            )}

            {/* Customer Results */}
            <Card title={`Kết quả tìm kiếm (${getFilteredCustomers().length} khách hàng)`}>
              <Table
                dataSource={getFilteredCustomers()}
                rowKey="maKH"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'Mã KH',
                    dataIndex: 'maKH',
                    key: 'maKH',
                    width: 80
                  },
                  {
                    title: 'Tên khách hàng',
                    dataIndex: 'tenKH',
                    key: 'tenKH',
                    render: (text: string) => <strong>{text}</strong>
                  },
                  {
                    title: 'Email',
                    dataIndex: 'email',
                    key: 'email'
                  },
                  {
                    title: 'Số điện thoại',
                    dataIndex: 'phone',
                    key: 'phone'
                  },
                  {
                    title: 'Số lần đặt phòng',
                    key: 'bookingCount',
                    render: (record: Customer) => {
                      const count = bookings.filter(b => b.maKH === record.maKH).length;
                      return <Tag color={count > 5 ? 'purple' : count > 2 ? 'blue' : 'green'}>{count}</Tag>;
                    }
                  },
                  {
                    title: 'Lần đặt cuối',
                    key: 'lastBooking',
                    render: (record: Customer) => {
                      const customerBookings = bookings.filter(b => b.maKH === record.maKH);
                      if (customerBookings.length === 0) return 'Chưa đặt phòng';
                      const lastBooking = customerBookings.sort((a, b) =>
                        dayjs(b.ngayDat).valueOf() - dayjs(a.ngayDat).valueOf()
                      )[0];
                      return dayjs(lastBooking.ngayDat).format('DD/MM/YYYY');
                    }
                  }
                ]}
              />
            </Card>
          </TabPane>

          <TabPane tab={<span><CalendarOutlined />Tìm kiếm Đặt phòng</span>} key="bookings">
            {/* Booking Search Filters */}
            <Card title="Bộ lọc tìm kiếm đặt phòng" style={{ marginBottom: 16 }}>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Input
                    placeholder="Tìm theo tên khách, số phòng, mã đặt phòng..."
                    prefix={<SearchOutlined />}
                    value={bookingSearchText}
                    onChange={(e) => setBookingSearchText(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col span={8}>
                  <Select
                    placeholder="Trạng thái đặt phòng"
                    style={{ width: '100%' }}
                    value={selectedBookingStatus}
                    onChange={setSelectedBookingStatus}
                    allowClear
                  >
                    {Object.entries(BOOKING_STATUS_CONFIG).map(([status, config]) => (
                      <Option key={status} value={parseInt(status)}>
                        <Tag color={config.color}>{config.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Card>

            {/* Booking Results */}
            <Card title={`Kết quả tìm kiếm (${getFilteredBookings().length} đặt phòng)`}>
              <Table
                dataSource={getFilteredBookings()}
                rowKey="maDatPhong"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'Mã đặt phòng',
                    dataIndex: 'maDatPhong',
                    key: 'maDatPhong',
                    width: 120,
                    render: (text: number) => <strong>#{text}</strong>
                  },
                  {
                    title: 'Khách hàng',
                    key: 'customerName',
                    render: (record: Booking) => {
                      const customer = customers.find(c => c.maKH === record.maKH);
                      return customer?.tenKH || 'N/A';
                    }
                  },
                  {
                    title: 'Phòng',
                    key: 'roomNumber',
                    render: (record: Booking) => {
                      const room = rooms.find(r => r.maPhong === record.maPhong);
                      return room?.soPhong || 'N/A';
                    }
                  },
                  {
                    title: 'Ngày đặt',
                    dataIndex: 'ngayDat',
                    key: 'ngayDat',
                    render: (date: string) => dayjs(date).format('DD/MM/YYYY')
                  },
                  {
                    title: 'Check-in',
                    dataIndex: 'checkIn',
                    key: 'checkIn',
                    render: (date: string) => dayjs(date).format('DD/MM/YYYY')
                  },
                  {
                    title: 'Check-out',
                    dataIndex: 'checkOut',
                    key: 'checkOut',
                    render: (date: string) => dayjs(date).format('DD/MM/YYYY')
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'trangThai',
                    key: 'trangThai',
                    render: (status: number) => {
                      const config = BOOKING_STATUS_CONFIG[status as keyof typeof BOOKING_STATUS_CONFIG];
                      return <Tag color={config?.color}>{config?.label}</Tag>;
                    }
                  }
                ]}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Spin>

      {/* Mobile Filter Drawer */}
      <Drawer
        title="Bộ lọc tìm kiếm"
        placement="bottom"
        height="60%"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        extra={
          <Space>
            <Button onClick={clearAllFilters} size="small">
              Xóa bộ lọc
            </Button>
            <Button
              type="primary"
              onClick={() => setFilterDrawerVisible(false)}
              size="small"
            >
              Áp dụng
            </Button>
          </Space>
        }
      >
        {renderMobileFilters()}
      </Drawer>
    </div>
  );
};

export default AdvancedSearchDashboard;
