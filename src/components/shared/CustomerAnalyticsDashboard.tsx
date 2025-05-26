import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, message, Statistic, Button, Select, Table, Tag, Progress } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  ReloadOutlined,
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { Column, Pie, Line } from '@ant-design/plots';
import dayjs from 'dayjs';
import { apiMethods } from '../../utils/apiUtils';

const { Option } = Select;

// Interfaces
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
}

interface Bill {
  maHD: number;
  maKH: number;
  tongTien: number;
  ngayLap: string;
  trangThai: number;
  xoa: boolean;
}

interface CustomerAnalyticsProps {
  showTitle?: boolean;
  height?: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  color: string;
}

interface CustomerValue {
  maKH: number;
  tenKH: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  customerType: string;
}

const CustomerAnalyticsDashboard: React.FC<CustomerAnalyticsProps> = ({
  showTitle = true,
  height = 300
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersRes, bookingsRes, billsRes] = await Promise.all([
        apiMethods.get('KhachHang/GetAll?PageNumber=1&PageSize=1000'),
        apiMethods.get('DatPhong/GetAll?PageNumber=1&PageSize=1000'),
        apiMethods.get('HoaDon/GetAll?PageNumber=1&PageSize=1000')
      ]);

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

      // Process bills data
      if (billsRes.success && billsRes.data) {
        const billsData = Array.isArray(billsRes.data) ? billsRes.data : billsRes.data.items || [];
        setBills(billsData.filter((bill: Bill) => !bill.xoa));
      }

    } catch (error) {
      message.error('Không thể tải dữ liệu phân tích khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate customer statistics
  const calculateCustomerStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(customer => {
      const hasRecentBooking = bookings.some(booking =>
        booking.maKH === customer.maKH &&
        dayjs(booking.ngayDat).isAfter(dayjs().subtract(3, 'month'))
      );
      return hasRecentBooking;
    }).length;

    const newCustomers = customers.filter(customer => {
      const firstBooking = bookings
        .filter(booking => booking.maKH === customer.maKH)
        .sort((a, b) => dayjs(a.ngayDat).valueOf() - dayjs(b.ngayDat).valueOf())[0];

      return firstBooking && dayjs(firstBooking.ngayDat).isAfter(dayjs().subtract(1, 'month'));
    }).length;

    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.tongTien || 0), 0);
    const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      totalRevenue,
      avgRevenuePerCustomer
    };
  };

  // Calculate customer segments
  const calculateCustomerSegments = (): CustomerSegment[] => {
    const customerBookingCounts = customers.map(customer => {
      const customerBookings = bookings.filter(booking => booking.maKH === customer.maKH);
      return {
        ...customer,
        bookingCount: customerBookings.length
      };
    });

    const vipCustomers = customerBookingCounts.filter(c => c.bookingCount >= 5).length;
    const regularCustomers = customerBookingCounts.filter(c => c.bookingCount >= 2 && c.bookingCount < 5).length;
    const newCustomers = customerBookingCounts.filter(c => c.bookingCount === 1).length;
    const inactiveCustomers = customerBookingCounts.filter(c => c.bookingCount === 0).length;

    const total = customers.length;

    return [
      {
        segment: 'VIP (5+ đặt phòng)',
        count: vipCustomers,
        percentage: total > 0 ? (vipCustomers / total * 100) : 0,
        color: '#722ed1'
      },
      {
        segment: 'Thường xuyên (2-4 đặt phòng)',
        count: regularCustomers,
        percentage: total > 0 ? (regularCustomers / total * 100) : 0,
        color: '#1890ff'
      },
      {
        segment: 'Mới (1 đặt phòng)',
        count: newCustomers,
        percentage: total > 0 ? (newCustomers / total * 100) : 0,
        color: '#52c41a'
      },
      {
        segment: 'Chưa đặt phòng',
        count: inactiveCustomers,
        percentage: total > 0 ? (inactiveCustomers / total * 100) : 0,
        color: '#faad14'
      }
    ];
  };

  // Calculate top customers by value
  const calculateTopCustomers = (): CustomerValue[] => {
    return customers.map(customer => {
      const customerBookings = bookings.filter(booking => booking.maKH === customer.maKH);
      const customerBills = bills.filter(bill => bill.maKH === customer.maKH);

      const totalSpent = customerBills.reduce((sum, bill) => sum + (bill.tongTien || 0), 0);
      const lastBooking = customerBookings.length > 0
        ? customerBookings.sort((a, b) => dayjs(b.ngayDat).valueOf() - dayjs(a.ngayDat).valueOf())[0]
        : null;

      let customerType = 'Mới';
      if (customerBookings.length >= 5) customerType = 'VIP';
      else if (customerBookings.length >= 2) customerType = 'Thường xuyên';
      else if (customerBookings.length === 1) customerType = 'Mới';
      else customerType = 'Chưa đặt phòng';

      return {
        maKH: customer.maKH,
        tenKH: customer.tenKH,
        totalBookings: customerBookings.length,
        totalSpent,
        lastBooking: lastBooking ? dayjs(lastBooking.ngayDat).format('DD/MM/YYYY') : 'Chưa có',
        customerType
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
  };

  // Calculate monthly customer trends
  const calculateMonthlyTrends = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = dayjs().subtract(11 - i, 'month');
      return {
        month: month.format('MM/YYYY'),
        newCustomers: 0,
        totalBookings: 0
      };
    });

    customers.forEach(customer => {
      const firstBooking = bookings
        .filter(booking => booking.maKH === customer.maKH)
        .sort((a, b) => dayjs(a.ngayDat).valueOf() - dayjs(b.ngayDat).valueOf())[0];

      if (firstBooking) {
        const bookingMonth = dayjs(firstBooking.ngayDat).format('MM/YYYY');
        const monthData = months.find(m => m.month === bookingMonth);
        if (monthData) {
          monthData.newCustomers++;
        }
      }
    });

    bookings.forEach(booking => {
      const bookingMonth = dayjs(booking.ngayDat).format('MM/YYYY');
      const monthData = months.find(m => m.month === bookingMonth);
      if (monthData) {
        monthData.totalBookings++;
      }
    });

    return months;
  };

  const stats = calculateCustomerStats();
  const segments = calculateCustomerSegments();
  const topCustomers = calculateTopCustomers();
  const monthlyTrends = calculateMonthlyTrends();

  return (
    <div>
      {showTitle && (
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>Dashboard Phân tích Khách hàng</h2>
            <p style={{ margin: 0, color: '#666' }}>Thống kê và phân tích hành vi khách hàng</p>
          </div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      )}

      {/* Controls */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            style={{ width: '100%' }}
          >
            <Option value="month">Tháng này</Option>
            <Option value="quarter">Quý này</Option>
            <Option value="year">Năm này</Option>
          </Select>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng khách hàng"
                value={stats.totalCustomers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Khách hàng hoạt động"
                value={stats.activeCustomers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Khách hàng mới (tháng)"
                value={stats.newCustomers}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Doanh thu TB/khách"
                value={stats.avgRevenuePerCustomer}
                precision={0}
                prefix={<DollarOutlined />}
                suffix="VNĐ"
                valueStyle={{ color: '#722ed1' }}
                formatter={(value) => `${value?.toLocaleString('vi-VN')}`}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="Phân khúc khách hàng">
              <Pie
                data={segments}
                angleField="count"
                colorField="segment"
                radius={0.8}
                height={height}
                label={{
                  type: 'outer',
                  content: '{name}: {percentage}%',
                }}
                interactions={[{ type: 'element-active' }]}
                color={segments.map(s => s.color)}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Xu hướng khách hàng theo tháng">
              <Line
                data={monthlyTrends}
                xField="month"
                yField="newCustomers"
                height={height}
                smooth={true}
                point={{
                  size: 5,
                  shape: 'diamond',
                }}
                label={{
                  style: {
                    fill: '#aaa',
                  },
                }}
                tooltip={{
                  formatter: (datum: any) => {
                    return {
                      name: 'Khách hàng mới',
                      value: `${datum.newCustomers} khách`,
                    };
                  },
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Customer Segments Progress */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="Phân bố khách hàng theo phân khúc">
              <Row gutter={16}>
                {segments.map((segment, index) => (
                  <Col span={6} key={index}>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <h4>{segment.segment}</h4>
                      <Progress
                        type="circle"
                        percent={segment.percentage}
                        format={() => `${segment.count}`}
                        strokeColor={segment.color}
                        size={80}
                      />
                      <p style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                        {segment.percentage.toFixed(1)}% - {segment.count} khách
                      </p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Top Customers Table */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Top 10 khách hàng có giá trị cao">
              <Table
                dataSource={topCustomers}
                rowKey="maKH"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Tên khách hàng',
                    dataIndex: 'tenKH',
                    key: 'tenKH',
                    render: (text: string) => <strong>{text}</strong>
                  },
                  {
                    title: 'Loại khách hàng',
                    dataIndex: 'customerType',
                    key: 'customerType',
                    render: (type: string) => {
                      let color = 'default';
                      if (type === 'VIP') color = 'purple';
                      else if (type === 'Thường xuyên') color = 'blue';
                      else if (type === 'Mới') color = 'green';
                      else color = 'orange';

                      return <Tag color={color}>{type}</Tag>;
                    }
                  },
                  {
                    title: 'Số lần đặt phòng',
                    dataIndex: 'totalBookings',
                    key: 'totalBookings',
                    align: 'center',
                    render: (count: number) => (
                      <span style={{ fontWeight: 'bold' }}>{count}</span>
                    )
                  },
                  {
                    title: 'Tổng chi tiêu',
                    dataIndex: 'totalSpent',
                    key: 'totalSpent',
                    align: 'right',
                    render: (amount: number) => (
                      <span style={{ color: '#722ed1', fontWeight: 'bold' }}>
                        {amount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    )
                  },
                  {
                    title: 'Lần đặt cuối',
                    dataIndex: 'lastBooking',
                    key: 'lastBooking',
                    align: 'center'
                  }
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* Monthly Bookings Chart */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="Tổng số đặt phòng theo tháng">
              <Column
                data={monthlyTrends}
                xField="month"
                yField="totalBookings"
                height={height}
                columnWidthRatio={0.8}
                meta={{
                  totalBookings: {
                    alias: 'Số đặt phòng',
                  },
                  month: {
                    alias: 'Tháng',
                  },
                }}
                label={{
                  position: 'top',
                  style: {
                    fill: '#FFFFFF',
                    opacity: 0.6,
                  },
                }}
                tooltip={{
                  formatter: (datum: any) => {
                    return {
                      name: 'Số đặt phòng',
                      value: `${datum.totalBookings} đặt phòng`,
                    };
                  },
                }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default CustomerAnalyticsDashboard;
