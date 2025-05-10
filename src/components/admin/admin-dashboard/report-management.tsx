import React, { useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Table, Select, Tabs, Divider, Typography } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, DownloadOutlined, ReloadOutlined, UserOutlined, HomeOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Title } = Typography;

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

// Khởi tạo state cho dữ liệu

const ReportManagement = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'day'), dayjs()]);
  const [reportType, setReportType] = useState<string>('daily');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [roomStatusData, setRoomStatusData] = useState<RoomStatusData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);

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
    return (
      <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Không có dữ liệu để hiển thị</p>
        </div>
      </div>
    );
  };

  // Tạo biểu đồ tròn
  const renderPieChart = () => {
    return (
      <div style={{ height: 300, background: '#f0f2f5', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Không có dữ liệu để hiển thị</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4}>Báo cáo & Thống kê</Title>
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
                  dataSource={roomStatusData}
                  rowKey="status"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={<span><LineChartOutlined />Báo cáo khách hàng</span>}
          key="3"
        >
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
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ReportManagement;
