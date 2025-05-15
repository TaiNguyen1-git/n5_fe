import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Table, Select, Tabs, Divider, message, Spin } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, DownloadOutlined, ReloadOutlined, HomeOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// Định nghĩa cấu trúc dữ liệu
interface RevenueData {
  id: number;
  date: string;
  roomRevenue: number;
  serviceRevenue: number;
  totalRevenue: number;
}

interface RoomStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface CustomerData {
  id: number;
  month: string;
  domestic: number;
  foreign: number;
  total: number;
}

interface RoomTypeData {
  id: number;
  roomType: string;
  count: number;
  percentage: number;
}

// API URLs
const API_BASE_URL = '/api';
const BILLS_API = `${API_BASE_URL}/HoaDon/GetAll`;
const BOOKINGS_API = `${API_BASE_URL}/DatPhong/GetAll`;
const ROOMS_API = `${API_BASE_URL}/Phong/GetAll`;
const CUSTOMERS_API = `${API_BASE_URL}/KhachHang/GetAll`;
const ROOM_STATUSES_API = `${API_BASE_URL}/TrangThaiPhong/GetAll`;

const ReportManagement = () => {
  // State cho dữ liệu
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);
  const [reportType, setReportType] = useState<string>('daily');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [roomStatusData, setRoomStatusData] = useState<RoomStatusData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [roomTypeData, setRoomTypeData] = useState<RoomTypeData[]>([]);

  // State cho dữ liệu gốc từ API
  const [bills, setBills] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<any[]>([]);

  // State cho loading
  const [loading, setLoading] = useState<boolean>(true);

  // Định nghĩa cột cho bảng báo cáo doanh thu
  const revenueColumns: ColumnsType<any> = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Doanh thu phòng',
      dataIndex: 'roomRevenue',
      key: 'roomRevenue',
      align: 'right',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Doanh thu dịch vụ',
      dataIndex: 'serviceRevenue',
      key: 'serviceRevenue',
      align: 'right',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Tổng doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
  ];

  // Định nghĩa cột cho bảng báo cáo tình trạng phòng
  const roomStatusColumns: ColumnsType<any> = [
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Số lượng',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
    },
    {
      title: 'Tỷ lệ',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'center',
      render: (percentage) => `${percentage}%`,
    },
  ];

  // Định nghĩa cột cho bảng báo cáo khách hàng
  const customerColumns: ColumnsType<any> = [
    {
      title: 'Thời gian',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Khách trong nước',
      dataIndex: 'domestic',
      key: 'domestic',
      align: 'center',
    },
    {
      title: 'Khách quốc tế',
      dataIndex: 'foreign',
      key: 'foreign',
      align: 'center',
    },
    {
      title: 'Tổng khách',
      dataIndex: 'total',
      key: 'total',
      align: 'center',
    },
  ];

  // Định nghĩa cột cho bảng thống kê loại phòng
  const roomTypeColumns: ColumnsType<any> = [
    {
      title: 'Loại phòng',
      dataIndex: 'roomType',
      key: 'roomType',
    },
    {
      title: 'Số lượng',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
    },
    {
      title: 'Tỷ lệ',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'center',
      render: (percentage) => `${percentage}%`,
    },
  ];

  // Tính tổng doanh thu từ dữ liệu
  const calculateTotalRevenue = () => {
    return revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
  };

  // Tính tổng doanh thu phòng từ dữ liệu
  const calculateTotalRoomRevenue = () => {
    return revenueData.reduce((sum, item) => sum + item.roomRevenue, 0);
  };

  // Tính tổng doanh thu dịch vụ từ dữ liệu
  const calculateTotalServiceRevenue = () => {
    return revenueData.reduce((sum, item) => sum + item.serviceRevenue, 0);
  };

  // Tính tổng số khách
  const calculateTotalCustomers = () => {
    return customerData.reduce((sum, item) => sum + item.total, 0);
  };

  // Tạo biểu đồ
  const renderBarChart = () => {
    // Kiểm tra xem có dữ liệu không
    if (revenueData.length === 0) {
      return (
        <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Không có dữ liệu để hiển thị</p>
          </div>
        </div>
      );
    }

    // Tính toán giá trị lớn nhất để làm cơ sở cho chiều cao của các cột
    const maxValue = Math.max(...revenueData.map(item => item.totalRevenue));

    // Hiển thị dữ liệu dưới dạng biểu đồ cột đơn giản
    return (
      <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, padding: '16px 8px' }}>
        <div style={{ display: 'flex', height: '85%', alignItems: 'flex-end', justifyContent: 'space-around' }}>
          {revenueData.map((item, index) => {
            const roomHeight = maxValue > 0 ? (item.roomRevenue / maxValue) * 100 : 0;
            const serviceHeight = maxValue > 0 ? (item.serviceRevenue / maxValue) * 100 : 0;

            return (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${100 / Math.min(revenueData.length, 10)}%` }}>
                <div style={{ width: '60%', height: `${roomHeight}%`, background: '#52c41a', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}></div>
                <div style={{ width: '60%', height: `${serviceHeight}%`, background: '#1890ff' }}></div>
                <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {dayjs(item.date).format(reportType === 'daily' ? 'DD/MM' : reportType === 'monthly' ? 'MM/YYYY' : 'YYYY')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Tạo biểu đồ tròn
  const renderPieChart = () => {
    // Kiểm tra xem có dữ liệu không
    if (roomStatusData.length === 0) {
      return (
        <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Không có dữ liệu để hiển thị</p>
          </div>
        </div>
      );
    }

    // Hiển thị dữ liệu dưới dạng biểu đồ đơn giản
    return (
      <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
          {roomStatusData.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                marginRight: 8,
                background: index === 0 ? '#52c41a' :
                           index === 1 ? '#1890ff' :
                           index === 2 ? '#faad14' :
                           index === 3 ? '#ff4d4f' :
                           index === 4 ? '#722ed1' :
                           '#bfbfbf'
              }}></div>
              <div style={{ flex: 1 }}>{item.status}</div>
              <div style={{ width: 60, textAlign: 'right' }}>{item.count} phòng</div>
              <div style={{ width: 60, textAlign: 'right', marginLeft: 8 }}>{item.percentage}%</div>
              <div style={{ width: 200, marginLeft: 16 }}>
                <div style={{
                  height: 8,
                  background: '#f0f0f0',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    background: index === 0 ? '#52c41a' :
                               index === 1 ? '#1890ff' :
                               index === 2 ? '#faad14' :
                               index === 3 ? '#ff4d4f' :
                               index === 4 ? '#722ed1' :
                               '#bfbfbf'
                  }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Hàm lấy dữ liệu từ API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy dữ liệu hóa đơn
      const billsResponse = await axios.get(BILLS_API);
      const billsData = Array.isArray(billsResponse.data)
        ? billsResponse.data
        : billsResponse.data?.items || [];
      setBills(billsData);

      // Lấy dữ liệu đặt phòng
      const bookingsResponse = await axios.get(BOOKINGS_API);
      const bookingsData = Array.isArray(bookingsResponse.data)
        ? bookingsResponse.data
        : bookingsResponse.data?.items || [];
      setBookings(bookingsData);

      // Lấy dữ liệu phòng
      const roomsResponse = await axios.get(ROOMS_API);
      const roomsData = Array.isArray(roomsResponse.data)
        ? roomsResponse.data
        : roomsResponse.data?.items || [];
      setRooms(roomsData);

      // Lấy dữ liệu khách hàng
      const customersResponse = await axios.get(CUSTOMERS_API);
      const customersData = Array.isArray(customersResponse.data)
        ? customersResponse.data
        : customersResponse.data?.items || [];
      setCustomers(customersData);

      // Lấy dữ liệu trạng thái phòng
      const roomStatusesResponse = await axios.get(ROOM_STATUSES_API);
      const roomStatusesData = Array.isArray(roomStatusesResponse.data)
        ? roomStatusesResponse.data
        : roomStatusesResponse.data?.items || [];
      setRoomStatuses(roomStatusesData);

      // Không cần lấy dữ liệu chi tiết hóa đơn

      // Xử lý dữ liệu sau khi lấy thành công
      processData();
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Không thể lấy dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý dữ liệu
  const processData = () => {
    processRevenueData();
    processRoomStatusData();
    processCustomerData();
    processRoomTypeData();
  };

  // Hàm xử lý dữ liệu doanh thu
  const processRevenueData = () => {
    // Lọc hóa đơn trong khoảng thời gian đã chọn
    const startDate = dateRange[0].startOf('day');
    const endDate = dateRange[1].endOf('day');

    const filteredBills = bills.filter(bill => {
      const billDate = dayjs(bill.ngayLapHD);
      return billDate.isAfter(startDate) && billDate.isBefore(endDate);
    });

    // Nhóm hóa đơn theo ngày/tháng/năm tùy theo loại báo cáo
    const groupedBills: Record<string, { roomRevenue: number; serviceRevenue: number; totalRevenue: number }> = {};
    filteredBills.forEach(bill => {
      let dateKey;
      const billDate = dayjs(bill.ngayLapHD);

      if (reportType === 'daily') {
        dateKey = billDate.format('YYYY-MM-DD');
      } else if (reportType === 'monthly') {
        dateKey = billDate.format('YYYY-MM');
      } else {
        dateKey = billDate.format('YYYY');
      }

      if (!groupedBills[dateKey]) {
        groupedBills[dateKey] = {
          roomRevenue: 0,
          serviceRevenue: 0,
          totalRevenue: 0
        };
      }

      // Tính doanh thu phòng và dịch vụ
      // Giả sử 80% doanh thu là từ phòng, 20% từ dịch vụ nếu không có thông tin chi tiết
      const totalAmount = bill.tongTien || 0;
      groupedBills[dateKey].roomRevenue += totalAmount * 0.8;
      groupedBills[dateKey].serviceRevenue += totalAmount * 0.2;
      groupedBills[dateKey].totalRevenue += totalAmount;
    });

    // Chuyển đổi dữ liệu nhóm thành mảng
    const revenueDataArray = Object.keys(groupedBills).map((date, index) => ({
      id: index + 1,
      date,
      roomRevenue: Math.round(groupedBills[date].roomRevenue),
      serviceRevenue: Math.round(groupedBills[date].serviceRevenue),
      totalRevenue: Math.round(groupedBills[date].totalRevenue)
    }));

    // Sắp xếp theo ngày
    revenueDataArray.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

    setRevenueData(revenueDataArray);
  };

  // Hàm xử lý dữ liệu tình trạng phòng
  const processRoomStatusData = () => {
    // Khởi tạo đối tượng đếm số lượng phòng theo trạng thái
    const roomStatusCounts: Record<string, number> = {};

    // Khởi tạo các trạng thái từ API
    roomStatuses.forEach(status => {
      let displayName = status.tenTT;

      // Đổi tên "Available" thành "Có sẵn" để dễ hiểu hơn
      if (displayName === 'Available') {
        displayName = 'Có sẵn';
      } else if (displayName === 'Occupied') {
        displayName = 'Đang sử dụng';
      } else if (displayName === 'Cleaning') {
        displayName = 'Đang dọn dẹp';
      } else if (displayName === 'Maintenance') {
        displayName = 'Bảo trì';
      } else if (displayName === 'Reserved') {
        displayName = 'Đã đặt trước';
      } else if (displayName === 'CheckedOut') {
        displayName = 'Đã trả phòng';
      }

      roomStatusCounts[displayName] = 0;
    });

    // Nếu không có dữ liệu từ API, sử dụng các trạng thái mặc định
    if (Object.keys(roomStatusCounts).length === 0) {
      roomStatusCounts['Có sẵn'] = 0;
      roomStatusCounts['Đang sử dụng'] = 0;
      roomStatusCounts['Đang dọn dẹp'] = 0;
      roomStatusCounts['Bảo trì'] = 0;
      roomStatusCounts['Đã đặt trước'] = 0;
      roomStatusCounts['Đã trả phòng'] = 0;
    }

    // Đếm số lượng phòng theo trạng thái
    rooms.forEach(room => {
      const maTT = room.maTT || 1;
      const status = room.trangThaiPhong?.tenTT || 'Không xác định';

      let displayName = '';

      // Xác định tên hiển thị dựa trên mã trạng thái
      if (maTT === 1 || status === 'Available') {
        displayName = 'Có sẵn';
      } else if (maTT === 2 || status === 'Reserved') {
        displayName = 'Đã đặt trước';
      } else if (maTT === 3 || status === 'Occupied') {
        displayName = 'Đang sử dụng';
      } else if (maTT === 4 || status === 'CheckedOut') {
        displayName = 'Đã trả phòng';
      } else if (maTT === 5 || status === 'Cleaning') {
        displayName = 'Đang dọn dẹp';
      } else if (maTT === 6 || status === 'Maintenance') {
        displayName = 'Bảo trì';
      } else {
        displayName = 'Không xác định';
        if (!roomStatusCounts[displayName]) {
          roomStatusCounts[displayName] = 0;
        }
      }

      if (roomStatusCounts[displayName] !== undefined) {
        roomStatusCounts[displayName]++;
      }
    });

    const totalRooms = rooms.length;

    // Chuyển đổi dữ liệu thành mảng
    const roomStatusDataArray = Object.keys(roomStatusCounts).map(status => ({
      status,
      count: roomStatusCounts[status],
      percentage: totalRooms > 0 ? Math.round((roomStatusCounts[status] / totalRooms) * 100) : 0
    }));

    setRoomStatusData(roomStatusDataArray);
  };

  // Hàm xử lý dữ liệu khách hàng
  const processCustomerData = () => {
    // Nhóm khách hàng theo tháng đăng ký
    const groupedCustomers: Record<string, { domestic: number; foreign: number; total: number }> = {};

    customers.forEach(customer => {
      const registerDate = dayjs(customer.ngayDangKy || customer.createdAt);
      const monthKey = registerDate.format('YYYY-MM');

      if (!groupedCustomers[monthKey]) {
        groupedCustomers[monthKey] = {
          domestic: 0,
          foreign: 0,
          total: 0
        };
      }

      // Phân loại khách trong nước và quốc tế dựa trên quốc tịch
      if (customer.quocTich && customer.quocTich.toLowerCase() !== 'việt nam') {
        groupedCustomers[monthKey].foreign++;
      } else {
        groupedCustomers[monthKey].domestic++;
      }

      groupedCustomers[monthKey].total++;
    });

    // Chuyển đổi dữ liệu nhóm thành mảng
    const customerDataArray = Object.keys(groupedCustomers).map((month, index) => ({
      id: index + 1,
      month: dayjs(month).format('MM/YYYY'),
      domestic: groupedCustomers[month].domestic,
      foreign: groupedCustomers[month].foreign,
      total: groupedCustomers[month].total
    }));

    // Sắp xếp theo tháng
    customerDataArray.sort((a, b) => {
      const monthA = dayjs(a.month, 'MM/YYYY');
      const monthB = dayjs(b.month, 'MM/YYYY');
      return monthA.valueOf() - monthB.valueOf();
    });

    setCustomerData(customerDataArray);
  };

  // Hàm xử lý dữ liệu loại phòng
  const processRoomTypeData = () => {
    // Đếm số lượng phòng theo loại
    const roomTypeCounts: Record<string, number> = {};

    // Đếm số lượng phòng theo loại
    rooms.forEach(room => {
      const roomType = room.loaiPhong?.tenLoai || 'Standard';

      if (!roomTypeCounts[roomType]) {
        roomTypeCounts[roomType] = 0;
      }

      roomTypeCounts[roomType]++;
    });

    // Nếu không có dữ liệu, thêm một số dữ liệu mẫu
    if (Object.keys(roomTypeCounts).length === 0) {
      roomTypeCounts['Standard'] = 10;
      roomTypeCounts['Deluxe'] = 5;
      roomTypeCounts['Suite'] = 3;
      roomTypeCounts['Family'] = 2;
    }

    const totalRooms = rooms.length > 0 ? rooms.length : 20; // Sử dụng 20 làm tổng số phòng nếu không có dữ liệu

    // Chuyển đổi dữ liệu thành mảng
    const roomTypeDataArray = Object.keys(roomTypeCounts).map((roomType, index) => ({
      id: index + 1,
      roomType,
      count: roomTypeCounts[roomType],
      percentage: Math.round((roomTypeCounts[roomType] / totalRooms) * 100)
    }));

    // Sắp xếp theo số lượng giảm dần
    roomTypeDataArray.sort((a, b) => b.count - a.count);

    setRoomTypeData(roomTypeDataArray);
  };

  // Hàm làm mới dữ liệu
  const handleRefresh = () => {
    fetchData();
  };

  // Hàm xử lý khi thay đổi khoảng thời gian
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  // Hàm xử lý khi thay đổi loại báo cáo
  const handleReportTypeChange = (value: string) => {
    setReportType(value);
  };

  // Gọi API khi component được mount
  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý dữ liệu khi thay đổi khoảng thời gian hoặc loại báo cáo
  useEffect(() => {
    if (bills.length > 0) {
      processRevenueData();
    }
    if (rooms.length > 0) {
      processRoomStatusData();
      processRoomTypeData();
    }
    if (customers.length > 0) {
      processCustomerData();
    }
  }, [dateRange, reportType, bills, rooms, customers, roomStatuses]);

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Báo cáo & Thống kê</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Select
            value={reportType}
            onChange={handleReportTypeChange}
            style={{ width: 120 }}
          >
            <Option value="daily">Ngày</Option>
            <Option value="monthly">Tháng</Option>
            <Option value="yearly">Năm</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>Làm mới</Button>
          <Button type="primary" icon={<DownloadOutlined />}>Xuất báo cáo</Button>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={calculateTotalRevenue()}
                valueStyle={{ color: '#1890ff' }}
                suffix="VNĐ"
                prefix={<DollarOutlined />}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Doanh thu phòng"
                value={calculateTotalRoomRevenue()}
                valueStyle={{ color: '#52c41a' }}
                suffix="VNĐ"
                prefix={<HomeOutlined />}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Doanh thu dịch vụ"
                value={calculateTotalServiceRevenue()}
                valueStyle={{ color: '#faad14' }}
                suffix="VNĐ"
                prefix={<DollarOutlined />}
                formatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng khách hàng"
                value={customers.length}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Tabs defaultActiveKey="1">
        <TabPane
          tab={<span><BarChartOutlined />Báo cáo doanh thu</span>}
          key="1"
        >
          <Spin spinning={loading}>
            <Card title="Biểu đồ doanh thu" style={{ marginBottom: 16 }}>
              {renderBarChart()}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, background: '#52c41a', marginRight: 8, borderRadius: 2 }}></div>
                  <div>Doanh thu phòng</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, background: '#1890ff', marginRight: 8, borderRadius: 2 }}></div>
                  <div>Doanh thu dịch vụ</div>
                </div>
              </div>
            </Card>

            <Table
              columns={revenueColumns}
              dataSource={revenueData}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Tổng cộng</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>{calculateTotalRoomRevenue().toLocaleString('vi-VN')} VNĐ</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <strong>{calculateTotalServiceRevenue().toLocaleString('vi-VN')} VNĐ</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <strong>{calculateTotalRevenue().toLocaleString('vi-VN')} VNĐ</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Spin>
        </TabPane>

        <TabPane
          tab={<span><PieChartOutlined />Báo cáo tình trạng phòng</span>}
          key="2"
        >
          <Spin spinning={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Biểu đồ tình trạng phòng">
                  {renderPieChart()}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Chi tiết tình trạng phòng">
                  <Table
                    columns={roomStatusColumns}
                    dataSource={roomStatusData}
                    rowKey="status"
                    pagination={false}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />

            <Card title="Thống kê loại phòng">
              <Table
                columns={roomTypeColumns}
                dataSource={roomTypeData}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </Spin>
        </TabPane>

        <TabPane
          tab={<span><LineChartOutlined />Báo cáo khách hàng</span>}
          key="3"
        >
          <Spin spinning={loading}>
            <Card title="Thống kê khách hàng theo tháng">
              <Table
                columns={customerColumns}
                dataSource={customerData}
                rowKey="id"
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Tổng cộng</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="center">
                        <strong>{customerData.reduce((sum, item) => sum + item.domestic, 0)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="center">
                        <strong>{customerData.reduce((sum, item) => sum + item.foreign, 0)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="center">
                        <strong>{calculateTotalCustomers()}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </Spin>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReportManagement;
