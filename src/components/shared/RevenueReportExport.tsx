import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Button, Select, Space, Row, Col, Statistic, Table, message, Spin } from 'antd';
import { 
  CalendarOutlined, 
  DollarOutlined, 
  FileExcelOutlined,
  FilePdfOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportService } from '../../services/exportService';
import SimpleExportButton from './SimpleExportButton';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface RevenueData {
  period: string;
  revenue: number;
  bookings: number;
  rooms: number;
  date?: string;
}

const RevenueReportExport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalRooms: 0,
    averageRevenue: 0
  });

  useEffect(() => {
    fetchRevenueData();
  }, [reportType, dateRange]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      const mockData = generateMockRevenueData();
      setRevenueData(mockData);
      
      // Calculate totals
      const totals = mockData.reduce((acc, item) => ({
        totalRevenue: acc.totalRevenue + item.revenue,
        totalBookings: acc.totalBookings + item.bookings,
        totalRooms: acc.totalRooms + item.rooms,
        averageRevenue: 0
      }), { totalRevenue: 0, totalBookings: 0, totalRooms: 0, averageRevenue: 0 });
      
      totals.averageRevenue = mockData.length > 0 ? totals.totalRevenue / mockData.length : 0;
      setTotalStats(totals);
      
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const generateMockRevenueData = (): RevenueData[] => {
    const data: RevenueData[] = [];
    const start = dateRange[0];
    const end = dateRange[1];
    
    if (reportType === 'daily') {
      let current = start.clone();
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        data.push({
          period: current.format('DD/MM/YYYY'),
          revenue: Math.floor(Math.random() * 10000000) + 5000000,
          bookings: Math.floor(Math.random() * 20) + 5,
          rooms: Math.floor(Math.random() * 15) + 3,
          date: current.format('YYYY-MM-DD')
        });
        current = current.add(1, 'day');
      }
    } else if (reportType === 'monthly') {
      let current = start.clone().startOf('month');
      while (current.isBefore(end) || current.isSame(end, 'month')) {
        data.push({
          period: current.format('MM/YYYY'),
          revenue: Math.floor(Math.random() * 300000000) + 150000000,
          bookings: Math.floor(Math.random() * 500) + 200,
          rooms: Math.floor(Math.random() * 400) + 150,
          date: current.format('YYYY-MM-DD')
        });
        current = current.add(1, 'month');
      }
    } else {
      let current = start.clone().startOf('year');
      while (current.isBefore(end) || current.isSame(end, 'year')) {
        data.push({
          period: current.format('YYYY'),
          revenue: Math.floor(Math.random() * 3000000000) + 1500000000,
          bookings: Math.floor(Math.random() * 5000) + 2000,
          rooms: Math.floor(Math.random() * 4000) + 1500,
          date: current.format('YYYY-MM-DD')
        });
        current = current.add(1, 'year');
      }
    }
    
    return data;
  };

  const handleQuickExport = (format: 'excel' | 'pdf') => {
    const periodText = reportType === 'daily' ? 'ngày' : 
                     reportType === 'monthly' ? 'tháng' : 'năm';
    
    const filename = `bao-cao-doanh-thu-${periodText}-${dayjs().format('YYYY-MM-DD')}`;
    const title = `BÁO CÁO DOANH THU THEO ${periodText.toUpperCase()}`;
    
    exportService.export({
      filename,
      title,
      columns: [
        { key: 'period', title: 'Thời gian', dataIndex: 'period' },
        { key: 'revenue', title: 'Doanh thu (VNĐ)', dataIndex: 'revenue', render: (value: number) => value?.toLocaleString('vi-VN') || '0' },
        { key: 'bookings', title: 'Số đặt phòng', dataIndex: 'bookings' },
        { key: 'rooms', title: 'Số phòng đã bán', dataIndex: 'rooms' }
      ],
      data: revenueData,
      format,
      orientation: 'landscape'
    });
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'period',
      key: 'period',
      width: 120
    },
    {
      title: 'Doanh thu (VNĐ)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {value.toLocaleString('vi-VN')}
        </span>
      ),
      width: 150
    },
    {
      title: 'Số đặt phòng',
      dataIndex: 'bookings',
      key: 'bookings',
      width: 120
    },
    {
      title: 'Số phòng đã bán',
      dataIndex: 'rooms',
      key: 'rooms',
      width: 130
    }
  ];

  const exportColumns = [
    { key: 'period', title: 'Thời gian', dataIndex: 'period' },
    { key: 'revenue', title: 'Doanh thu (VNĐ)', dataIndex: 'revenue', render: (value: number) => value?.toLocaleString('vi-VN') || '0' },
    { key: 'bookings', title: 'Số đặt phòng', dataIndex: 'bookings' },
    { key: 'rooms', title: 'Số phòng đã bán', dataIndex: 'rooms' }
  ];

  const getReportTitle = () => {
    const periodText = reportType === 'daily' ? 'NGÀY' : 
                      reportType === 'monthly' ? 'THÁNG' : 'NĂM';
    return `BÁO CÁO DOANH THU THEO ${periodText}`;
  };

  const getFilename = () => {
    const periodText = reportType === 'daily' ? 'ngay' : 
                      reportType === 'monthly' ? 'thang' : 'nam';
    return `bao-cao-doanh-thu-${periodText}-${dayjs().format('YYYY-MM-DD')}`;
  };

  return (
    <div>
      <Card title="📊 Báo cáo Doanh thu & Xuất dữ liệu" style={{ marginBottom: 24 }}>
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <label>Loại báo cáo:</label>
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: '100%' }}
              >
                <Option value="daily">Theo ngày</Option>
                <Option value="monthly">Theo tháng</Option>
                <Option value="yearly">Theo năm</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={10}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <label>Khoảng thời gian:</label>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                style={{ width: '100%' }}
                picker={reportType === 'yearly' ? 'year' : reportType === 'monthly' ? 'month' : 'date'}
              />
            </Space>
          </Col>
          <Col xs={24} sm={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <label>Xuất báo cáo:</label>
              <SimpleExportButton
                data={revenueData}
                columns={exportColumns}
                filename={getFilename()}
                title={getReportTitle()}
                loading={loading}
              />
            </Space>
          </Col>
        </Row>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Tổng doanh thu"
              value={totalStats.totalRevenue}
              formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Tổng đặt phòng"
              value={totalStats.totalBookings}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Tổng phòng bán"
              value={totalStats.totalRooms}
              prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Doanh thu TB"
              value={totalStats.averageRevenue}
              formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
            />
          </Col>
        </Row>

        {/* Data Table */}
        <Spin spinning={loading}>
          <Table
            dataSource={revenueData}
            columns={columns}
            rowKey="period"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            summary={() => (
              <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                <Table.Summary.Cell index={0}>
                  <strong>Tổng cộng</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong style={{ color: '#52c41a' }}>
                    {totalStats.totalRevenue.toLocaleString('vi-VN')} VNĐ
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{totalStats.totalBookings}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>{totalStats.totalRooms}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Spin>

        {/* Quick Export Buttons */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space wrap>
              <Button
                icon={<FileExcelOutlined style={{ color: '#1D6F42' }} />}
                onClick={() => handleQuickExport('excel')}
                loading={loading}
              >
                Xuất Excel
              </Button>
              <Button
                icon={<FilePdfOutlined style={{ color: '#DC2626' }} />}
                onClick={() => handleQuickExport('pdf')}
                loading={loading}
              >
                Xuất PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RevenueReportExport;
