import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Table, Tabs, Divider, message, Spin, Space, Dropdown, Radio } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, DownloadOutlined, ReloadOutlined, HomeOutlined, DollarOutlined, TeamOutlined, CalendarOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import { revenueService, RevenueData as ApiRevenueData } from '../../../services/revenueService';
import styles from './chart-styles.module.css';

const { RangePicker } = DatePicker;
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
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [quickDateRange, setQuickDateRange] = useState<string>('30days');

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
    // Không sử dụng dữ liệu mẫu nữa, chỉ sử dụng dữ liệu từ API

    // Kiểm tra xem có dữ liệu từ API không
    if (revenueData.length === 0) {
      return (
        <div style={{ height: 300, background: 'white', border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Không có dữ liệu để hiển thị</p>
          </div>
        </div>
      );
    }

    // Đảm bảo dữ liệu được sắp xếp theo ngày
    const sortedData = [...revenueData].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

    // Lọc dữ liệu để chỉ hiển thị các mục có doanh thu > 0
    let filteredData = sortedData.filter(item => item.totalRevenue > 0);

    // Nếu không có mục nào có doanh thu > 0, hiển thị thông báo không có doanh thu
    if (filteredData.length === 0) {
      return (
        <div style={{ height: 300, background: 'white', border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Không có doanh thu trong khoảng thời gian này</p>
          </div>
        </div>
      );
    }

    // Đã xử lý trường hợp không có doanh thu ở trên

    // Tính toán giá trị lớn nhất để làm cơ sở cho chiều cao của các cột
    const maxValue = Math.max(...filteredData.map(item => item.totalRevenue));

    // Giới hạn số lượng cột hiển thị để tránh quá đông
    const maxBars = 15;
    const dataToShow = filteredData.length > maxBars
      ? filteredData.slice(Math.max(0, filteredData.length - maxBars))
      : filteredData;

    // Hiển thị dữ liệu dưới dạng biểu đồ cột đơn giản
    return (
      <div style={{ height: 300, background: 'white', border: '1px solid #e8e8e8', borderRadius: 8, padding: '8px 8px', position: 'relative' }}>
        {/* Bỏ tiêu đề biểu đồ theo yêu cầu */}

        {/* Bỏ các nhãn giá trị trên trục Y theo yêu cầu */}

        {/* Đường kẻ ngang ở giữa */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: 1,
          background: '#e0e0e0',
          zIndex: 1
        }}></div>

        {/* Đường kẻ ngang ở 25% */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '25%',
          height: 1,
          background: '#eeeeee',
          zIndex: 1
        }}></div>

        {/* Đường kẻ ngang ở 75% */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '75%',
          height: 1,
          background: '#eeeeee',
          zIndex: 1
        }}></div>

        {/* Hiển thị trục X */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: '#d0d0d0',
          marginBottom: 30
        }}></div>

        <div style={{
          display: 'flex',
          height: '85%',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          marginTop: 10,
          marginBottom: 30,
          position: 'relative',
          zIndex: 2,
          background: 'rgba(240, 240, 240, 0.2)'
        }}>
          {dataToShow.map((item, index) => {
            // Đảm bảo chiều cao tối thiểu cho các cột có giá trị
            const minHeight = item.totalRevenue > 0 ? 5 : 0;
            const roomHeight = maxValue > 0 ? Math.max(minHeight, (item.roomRevenue / maxValue) * 100) : 0;
            const serviceHeight = maxValue > 0 ? Math.max(minHeight, (item.serviceRevenue / maxValue) * 100) : 0;

            return (
              <div
                key={index}
                className={styles.chartColumn}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: `${100 / Math.min(dataToShow.length, maxBars)}%`,
                  cursor: 'pointer',
                  position: 'relative',
                  paddingLeft: 2,
                  paddingRight: 2,
                  background: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                  height: '100%'
                }}
                title={`Ngày: ${dayjs(item.date).format('DD/MM/YYYY')}
Doanh thu phòng: ${item.roomRevenue.toLocaleString('vi-VN')} VNĐ
Doanh thu dịch vụ: ${item.serviceRevenue.toLocaleString('vi-VN')} VNĐ
Tổng doanh thu: ${item.totalRevenue.toLocaleString('vi-VN')} VNĐ`}
                onClick={() => {
                  message.info(`Doanh thu ngày ${dayjs(item.date).format('DD/MM/YYYY')}: ${item.totalRevenue.toLocaleString('vi-VN')} VNĐ`);
                }}
              >
                <div
                  className={styles.chartBarRoom}
                  style={{
                    width: '70%',
                    height: roomHeight > 0 ? `${roomHeight}%` : '0',
                    minHeight: roomHeight > 0 ? '5px' : '0',
                    background: '#4CAF50',
                    borderRadius: 4,
                    position: 'relative',
                    zIndex: 2,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    marginBottom: 1,
                    border: roomHeight > 0 ? '1px solid #43A047' : 'none'
                  }}
                >
                  {roomHeight > 15 && (
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: 10,
                      color: 'white',
                      textShadow: '0 0 2px rgba(0,0,0,0.5)'
                    }}>
                      {Math.round(item.roomRevenue / 1000)}
                    </div>
                  )}
                  {roomHeight <= 15 && roomHeight > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -16,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: 10,
                      color: '#4CAF50',
                      fontWeight: 'bold'
                    }}>
                      {Math.round(item.roomRevenue / 1000)}
                    </div>
                  )}
                </div>
                <div
                  className={styles.chartBarService}
                  style={{
                    width: '70%',
                    height: serviceHeight > 0 ? `${serviceHeight}%` : '0',
                    minHeight: serviceHeight > 0 ? '5px' : '0',
                    background: '#2196F3',
                    borderRadius: 4,
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    border: serviceHeight > 0 ? '1px solid #1E88E5' : 'none'
                  }}>
                  {serviceHeight > 15 && (
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: 10,
                      color: 'white',
                      textShadow: '0 0 2px rgba(0,0,0,0.5)'
                    }}>
                      {Math.round(item.serviceRevenue / 1000)}
                    </div>
                  )}
                  {serviceHeight <= 15 && serviceHeight > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: -16,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: 10,
                      color: '#2196F3',
                      fontWeight: 'bold'
                    }}>
                      {Math.round(item.serviceRevenue / 1000)}
                    </div>
                  )}
                </div>
                <div
                  className={styles.chartLabel}
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    color: '#333',
                    fontWeight: index % 2 === 0 ? 'bold' : 'normal',
                    position: 'relative',
                    backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                    padding: '2px 0',
                    borderRadius: 2
                  }}>
                  {dayjs(item.date).format(reportType === 'daily' ? 'DD/MM' : reportType === 'monthly' ? 'MM/YYYY' : 'YYYY')}
                  {index % 2 === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -25,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 1,
                      height: 5,
                      background: '#ddd'
                    }}></div>
                  )}
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
        <div style={{ height: 300, background: 'white', border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Không có dữ liệu để hiển thị</p>
          </div>
        </div>
      );
    }

    // Hiển thị dữ liệu dưới dạng biểu đồ đơn giản
    return (
      <div style={{ height: 300, background: 'white', border: '1px solid #e8e8e8', borderRadius: 8, padding: 16 }}>
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
      // Lấy tổng doanh thu
      try {
        const totalRevenueValue = await revenueService.getTotalRevenue();
        setTotalRevenue(totalRevenueValue);
      } catch (totalRevenueError) {
        // Nếu không lấy được tổng doanh thu, sử dụng tổng từ dữ liệu chi tiết
      }

      // Lấy dữ liệu doanh thu từ API mới
      try {
        // Lấy dữ liệu doanh thu dựa trên loại báo cáo và khoảng thời gian
        const revenueDataFromApi = await revenueService.getRevenueForDateRange(
          dateRange[0],
          dateRange[1],
          reportType
        );

        // Chuyển đổi dữ liệu doanh thu từ API sang định dạng hiển thị
        const formattedRevenueData = revenueDataFromApi.map((item, index) => {
          let dateStr = '';

          if (reportType === 'daily') {
            // Đảm bảo ngày, tháng, năm đều có giá trị
            const day = item.ngay || dayjs().date();
            const month = item.thang || dayjs().month() + 1;
            const year = item.nam || dayjs().year();
            dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          } else if (reportType === 'monthly') {
            const month = item.thang || dayjs().month() + 1;
            const year = item.nam || dayjs().year();
            dateStr = `${year}-${String(month).padStart(2, '0')}`;
          } else {
            dateStr = `${item.nam || dayjs().year()}`;
          }

          // Đảm bảo doanh thu là số dương
          const totalRevenue = Math.max(0, item.tongDoanhThu || 0);

          // Sử dụng doanh thu phòng và dịch vụ từ API nếu có, nếu không thì giả định 80/20
          let roomRevenue = 0;
          let serviceRevenue = 0;

          if (item.roomRevenue !== undefined && item.serviceRevenue !== undefined) {
            // Sử dụng giá trị từ API
            roomRevenue = Math.round(item.roomRevenue);
            serviceRevenue = Math.round(item.serviceRevenue);
          } else {
            // Giả định 80% doanh thu là từ phòng, 20% từ dịch vụ
            roomRevenue = Math.round(totalRevenue * 0.8);
            serviceRevenue = Math.round(totalRevenue * 0.2);
          }
          return {
            id: index + 1,
            date: dateStr,
            roomRevenue: roomRevenue,
            serviceRevenue: serviceRevenue,
            totalRevenue: totalRevenue
          };
        });

        // Sắp xếp dữ liệu theo ngày
        formattedRevenueData.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

        // Cập nhật state với dữ liệu doanh thu mới
        setRevenueData(formattedRevenueData);
      } catch (revenueError) {
        message.warning('Không thể lấy dữ liệu doanh thu từ API. Sử dụng dữ liệu từ hóa đơn.');

        // Nếu không lấy được dữ liệu doanh thu, sử dụng phương pháp cũ
        // Lấy dữ liệu hóa đơn
        const billsResponse = await axios.get(BILLS_API);
        const billsData = Array.isArray(billsResponse.data)
          ? billsResponse.data
          : billsResponse.data?.items || [];
        setBills(billsData);

        // Xử lý dữ liệu doanh thu từ hóa đơn
        processRevenueData();
      }

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

      // Xử lý dữ liệu khác sau khi lấy thành công
      processRoomStatusData();
      processCustomerData();
      processRoomTypeData();
    } catch (error) {
      message.error('Không thể lấy dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Các hàm xử lý dữ liệu được gọi riêng lẻ khi cần

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

    // Nếu không có dữ liệu, hiển thị thông báo không có dữ liệu
    if (Object.keys(roomTypeCounts).length === 0) {
      return; // Sẽ hiển thị thông báo "Không có dữ liệu để hiển thị" ở component
    }

    const totalRooms = rooms.length;

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
      setQuickDateRange('custom');
    }
  };

  // Hàm xử lý khi thay đổi loại báo cáo
  const handleReportTypeChange = (value: string) => {
    setReportType(value);
  };

  // Hàm xử lý khi chọn khoảng thời gian nhanh
  const handleQuickDateRangeChange = (value: string) => {
    setQuickDateRange(value);

    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs = dayjs();

    // Đặt loại báo cáo phù hợp với khoảng thời gian
    if (value === 'thisYear' || value === 'lastYear') {
      // Khi chọn năm, chuyển sang báo cáo theo tháng để tránh quá nhiều dữ liệu
      setReportType('monthly');
    } else if (value === 'thisMonth' || value === 'lastMonth') {
      // Khi chọn tháng, chuyển sang báo cáo theo ngày
      setReportType('daily');
    }

    switch (value) {
      case 'today':
        start = dayjs().startOf('day');
        break;
      case 'yesterday':
        start = dayjs().subtract(1, 'day').startOf('day');
        end = dayjs().subtract(1, 'day').endOf('day');
        break;
      case '7days':
        start = dayjs().subtract(7, 'day');
        break;
      case '30days':
        start = dayjs().subtract(30, 'day');
        break;
      case 'thisMonth':
        start = dayjs().startOf('month');
        break;
      case 'lastMonth':
        start = dayjs().subtract(1, 'month').startOf('month');
        end = dayjs().subtract(1, 'month').endOf('month');
        break;
      case 'thisYear':
        // Khi chọn năm nay, giới hạn số lượng dữ liệu bằng cách chỉ lấy dữ liệu theo tháng
        start = dayjs().startOf('year');
        // Đặt cờ để xử lý đặc biệt
        setTimeout(() => {
          // Hiển thị thông báo đang tải dữ liệu năm
          message.info('Đang tải dữ liệu doanh thu năm ' + dayjs().year());
        }, 0);
        break;
      case 'lastYear':
        start = dayjs().subtract(1, 'year').startOf('year');
        end = dayjs().subtract(1, 'year').endOf('year');
        // Đặt cờ để xử lý đặc biệt
        setTimeout(() => {
          // Hiển thị thông báo đang tải dữ liệu năm
          message.info('Đang tải dữ liệu doanh thu năm ' + dayjs().subtract(1, 'year').year());
        }, 0);
        break;
      default:
        start = dayjs().subtract(30, 'day');
    }

    setDateRange([start, end]);

    // Không sử dụng dữ liệu mẫu nữa, chỉ sử dụng dữ liệu từ API
  };

  // Gọi API khi component được mount
  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý dữ liệu khi thay đổi khoảng thời gian hoặc loại báo cáo
  useEffect(() => {
    // Kiểm tra xem có phải đang xem dữ liệu năm không
    const isYearView = quickDateRange === 'thisYear' || quickDateRange === 'lastYear';

    // Nếu đang xem dữ liệu năm và đã có dữ liệu mẫu, không cần gọi API lại
    if (isYearView && revenueData.length > 0) {
      return;
    }

    // Khi thay đổi khoảng thời gian hoặc loại báo cáo, gọi lại API để lấy dữ liệu doanh thu mới
    fetchData();
  }, [dateRange, reportType, quickDateRange]);

  // Custom styles for the filter section
  const filterStyles = {
    container: {
      background: '#f5f7fa',
      borderRadius: 8,
      padding: '8px 12px',
      marginBottom: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    filterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      fontSize: 13,
      color: '#666',
      marginRight: 4,
    },
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Báo cáo & Thống kê</h2>
      </div>

      <div style={filterStyles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={filterStyles.filterGroup}>
            <span style={filterStyles.label}>Loại báo cáo:</span>
            <Radio.Group
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="daily">Ngày</Radio.Button>
              <Radio.Button value="monthly">Tháng</Radio.Button>
              <Radio.Button value="yearly">Năm</Radio.Button>
            </Radio.Group>
          </div>

          <div style={filterStyles.filterGroup}>
            <span style={filterStyles.label}>Thời gian:</span>
            <Dropdown
              menu={{
                items: [
                  { key: 'today', label: 'Hôm nay' },
                  { key: 'yesterday', label: 'Hôm qua' },
                  { key: '7days', label: '7 ngày qua' },
                  { key: '30days', label: '30 ngày qua' },
                  { type: 'divider' },
                  { key: 'thisMonth', label: 'Tháng này' },
                  { key: 'lastMonth', label: 'Tháng trước' },
                  { type: 'divider' },
                  { key: 'thisYear', label: 'Năm nay' },
                  { key: 'lastYear', label: 'Năm trước' }
                ],
                onClick: ({ key }) => handleQuickDateRangeChange(key)
              }}
              trigger={['click']}
            >
              <Button size="small" icon={<CalendarOutlined />} style={{ marginRight: 4 }}>
                {quickDateRange === 'today' && 'Hôm nay'}
                {quickDateRange === 'yesterday' && 'Hôm qua'}
                {quickDateRange === '7days' && '7 ngày qua'}
                {quickDateRange === '30days' && '30 ngày qua'}
                {quickDateRange === 'thisMonth' && 'Tháng này'}
                {quickDateRange === 'lastMonth' && 'Tháng trước'}
                {quickDateRange === 'thisYear' && 'Năm nay'}
                {quickDateRange === 'lastYear' && 'Năm trước'}
                {quickDateRange === 'custom' && 'Tùy chỉnh'}
              </Button>
            </Dropdown>

            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              size="small"
              style={{ width: 210 }}
              allowClear={false}
              format="DD/MM/YYYY"
            />

            <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh} title="Làm mới" />
            <Button size="small" type="primary" icon={<DownloadOutlined />} title="Xuất báo cáo">Xuất</Button>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={totalRevenue || calculateTotalRevenue()}
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

      <Tabs
        defaultActiveKey="1"
        type="card"
        size="small"
        style={{ marginTop: 16 }}
      >
        <TabPane
          tab={<span><BarChartOutlined />Báo cáo doanh thu</span>}
          key="1"
        >
          <Spin spinning={loading}>
            <Card
              title="Biểu đồ doanh thu"
              style={{ marginBottom: 16 }}
              size="small"
              extra={
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 10, height: 10, background: '#52c41a', marginRight: 6, borderRadius: 2 }}></div>
                    <div>Doanh thu phòng</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 10, height: 10, background: '#1890ff', marginRight: 6, borderRadius: 2 }}></div>
                    <div>Doanh thu dịch vụ</div>
                  </div>
                </div>
              }
            >
              {renderBarChart()}
            </Card>

            <Table
              columns={revenueColumns}
              dataSource={revenueData}
              rowKey="id"
              pagination={false}
              size="small"
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
                <Card title="Biểu đồ tình trạng phòng" size="small">
                  {renderPieChart()}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Chi tiết tình trạng phòng" size="small">
                  <Table
                    columns={roomStatusColumns}
                    dataSource={roomStatusData}
                    rowKey="status"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <Card title="Thống kê loại phòng" size="small">
              <Table
                columns={roomTypeColumns}
                dataSource={roomTypeData}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Spin>
        </TabPane>

        <TabPane
          tab={<span><LineChartOutlined />Báo cáo khách hàng</span>}
          key="3"
        >
          <Spin spinning={loading}>
            <Card title="Thống kê khách hàng theo tháng" size="small">
              <Table
                columns={customerColumns}
                dataSource={customerData}
                rowKey="id"
                pagination={false}
                size="small"
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
