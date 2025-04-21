import React, { useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Table, Select, Tabs, Divider } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, DownloadOutlined, ReloadOutlined, UserOutlined, HomeOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock data cho báo cáo doanh thu
const mockRevenueData = [
  { id: 1, date: '2025-04-01', roomRevenue: 5000000, serviceRevenue: 2000000, totalRevenue: 7000000 },
  { id: 2, date: '2025-04-02', roomRevenue: 6000000, serviceRevenue: 1500000, totalRevenue: 7500000 },
  { id: 3, date: '2025-04-03', roomRevenue: 4500000, serviceRevenue: 2500000, totalRevenue: 7000000 },
  { id: 4, date: '2025-04-04', roomRevenue: 7000000, serviceRevenue: 3000000, totalRevenue: 10000000 },
  { id: 5, date: '2025-04-05', roomRevenue: 8000000, serviceRevenue: 2800000, totalRevenue: 10800000 },
  { id: 6, date: '2025-04-06', roomRevenue: 6500000, serviceRevenue: 2200000, totalRevenue: 8700000 },
  { id: 7, date: '2025-04-07', roomRevenue: 5500000, serviceRevenue: 1800000, totalRevenue: 7300000 },
];

// Mock data cho báo cáo tình trạng phòng
const mockRoomStatusData = [
  { status: 'Trống', count: 10, percentage: 50 },
  { status: 'Đã đặt', count: 5, percentage: 25 },
  { status: 'Đang sử dụng', count: 4, percentage: 20 },
  { status: 'Đang dọn dẹp', count: 1, percentage: 5 },
];

// Mock data cho báo cáo khách hàng
const mockCustomerData = [
  { id: 1, month: 'Tháng 1', domestic: 120, foreign: 45, total: 165 },
  { id: 2, month: 'Tháng 2', domestic: 150, foreign: 60, total: 210 },
  { id: 3, month: 'Tháng 3', domestic: 180, foreign: 75, total: 255 },
  { id: 4, month: 'Tháng 4', domestic: 200, foreign: 90, total: 290 },
];

// Mock data cho top phòng được đặt nhiều nhất
const mockTopRoomsData = [
  { id: 1, roomNumber: '101', roomType: 'VIP', bookingCount: 15, revenue: 30000000 },
  { id: 2, roomNumber: '102', roomType: 'Duo', bookingCount: 12, revenue: 18000000 },
  { id: 3, roomNumber: '201', roomType: 'Single', bookingCount: 10, revenue: 10000000 },
  { id: 4, roomNumber: '202', roomType: 'Triple', bookingCount: 8, revenue: 14400000 },
  { id: 5, roomNumber: '301', roomType: 'VIP', bookingCount: 7, revenue: 14000000 },
];

const ReportManagement = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'day'), dayjs()]);
  const [reportType, setReportType] = useState<string>('daily');

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

  // Định nghĩa cột cho bảng top phòng được đặt nhiều nhất
  const topRoomsColumns: ColumnsType<any> = [
    {
      title: 'Phòng',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      render: (text, record) => `${text} (${record.roomType})`,
    },
    {
      title: 'Số lần đặt',
      dataIndex: 'bookingCount',
      key: 'bookingCount',
      align: 'center',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
  ];

  // Tính tổng doanh thu từ dữ liệu
  const calculateTotalRevenue = () => {
    return mockRevenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
  };

  // Tính tổng doanh thu phòng từ dữ liệu
  const calculateTotalRoomRevenue = () => {
    return mockRevenueData.reduce((sum, item) => sum + item.roomRevenue, 0);
  };

  // Tính tổng doanh thu dịch vụ từ dữ liệu
  const calculateTotalServiceRevenue = () => {
    return mockRevenueData.reduce((sum, item) => sum + item.serviceRevenue, 0);
  };

  // Tính tổng số khách
  const calculateTotalCustomers = () => {
    return mockCustomerData.reduce((sum, item) => sum + item.total, 0);
  };

  // Tạo dữ liệu giả cho biểu đồ
  const renderBarChart = () => {
    return (
      <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, display: 'flex', alignItems: 'flex-end', padding: '20px 10px', gap: 15 }}>
        {mockRevenueData.map((item, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ width: '100%', display: 'flex', height: 200, flexDirection: 'column', gap: 4 }}>
              <div 
                style={{ 
                  height: `${(item.serviceRevenue / 10000000) * 100}%`, 
                  background: '#1890ff',
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }} 
              />
              <div 
                style={{ 
                  height: `${(item.roomRevenue / 10000000) * 100}%`, 
                  background: '#52c41a',
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 4,
                }} 
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12 }}>{dayjs(item.date).format('DD/MM')}</div>
          </div>
        ))}
      </div>
    );
  };

  // Tạo dữ liệu giả cho biểu đồ tròn
  const renderPieChart = () => {
    return (
      <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          {/* Tạo biểu đồ tròn giả */}
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="transparent" stroke="#52c41a" strokeWidth="40" strokeDasharray="251.2" strokeDashoffset="0" />
            <circle cx="100" cy="100" r="80" fill="transparent" stroke="#1890ff" strokeWidth="40" strokeDasharray="251.2" strokeDashoffset="188.4" />
            <circle cx="100" cy="100" r="80" fill="transparent" stroke="#faad14" strokeWidth="40" strokeDasharray="251.2" strokeDashoffset="125.6" />
            <circle cx="100" cy="100" r="80" fill="transparent" stroke="#f5222d" strokeWidth="40" strokeDasharray="251.2" strokeDashoffset="62.8" />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>20</div>
            <div>Phòng</div>
          </div>
        </div>
        <div style={{ marginLeft: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, background: '#52c41a', marginRight: 8, borderRadius: 2 }}></div>
            <div>Trống (50%)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, background: '#1890ff', marginRight: 8, borderRadius: 2 }}></div>
            <div>Đã đặt (25%)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, background: '#faad14', marginRight: 8, borderRadius: 2 }}></div>
            <div>Đang sử dụng (20%)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, background: '#f5222d', marginRight: 8, borderRadius: 2 }}></div>
            <div>Đang dọn dẹp (5%)</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Báo cáo & Thống kê</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <RangePicker 
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
          <Select 
            value={reportType} 
            onChange={setReportType}
            style={{ width: 120 }}
          >
            <Option value="daily">Ngày</Option>
            <Option value="monthly">Tháng</Option>
            <Option value="yearly">Năm</Option>
          </Select>
          <Button icon={<ReloadOutlined />}>Làm mới</Button>
          <Button type="primary" icon={<DownloadOutlined />}>Xuất báo cáo</Button>
        </div>
      </div>
      
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
              value={calculateTotalCustomers()} 
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Tabs defaultActiveKey="1">
        <TabPane 
          tab={<span><BarChartOutlined />Báo cáo doanh thu</span>} 
          key="1"
        >
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
            dataSource={mockRevenueData}
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
        </TabPane>
        
        <TabPane 
          tab={<span><PieChartOutlined />Báo cáo tình trạng phòng</span>} 
          key="2"
        >
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
                  dataSource={mockRoomStatusData}
                  rowKey="status"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Card title="Top 5 phòng được đặt nhiều nhất">
            <Table 
              columns={topRoomsColumns} 
              dataSource={mockTopRoomsData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
        
        <TabPane 
          tab={<span><LineChartOutlined />Báo cáo khách hàng</span>} 
          key="3"
        >
          <Card title="Thống kê khách hàng theo tháng">
            <Table 
              columns={customerColumns} 
              dataSource={mockCustomerData}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Tổng cộng</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <strong>{mockCustomerData.reduce((sum, item) => sum + item.domestic, 0)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <strong>{mockCustomerData.reduce((sum, item) => sum + item.foreign, 0)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <strong>{calculateTotalCustomers()}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReportManagement;
