import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Spin, message, Statistic } from 'antd';
import { Line, Column } from '@ant-design/plots';
import { DollarOutlined, RiseOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { revenueService, RevenueData } from '../../services/revenueService';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface RevenueChartsProps {
  showTitle?: boolean;
  height?: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  year: number;
}

interface YearlyRevenueData {
  year: string;
  revenue: number;
}

const RevenueCharts: React.FC<RevenueChartsProps> = ({
  showTitle = true,
  height = 300
}) => {
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyRevenueData[]>([]);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0);

  // Fetch total revenue
  const fetchTotalRevenue = async () => {
    try {
      const total = await revenueService.getTotalRevenue();
      setTotalRevenue(total);
    } catch (error) {    }
  };

  // Fetch monthly revenue data
  const fetchMonthlyRevenue = async (year: number) => {
    setLoading(true);
    try {
      const monthlyPromises = Array.from({ length: 12 }, (_, i) =>
        revenueService.getRevenueByMonth(i + 1, year)
      );

      const monthlyResults = await Promise.all(monthlyPromises);

      const formattedData: MonthlyRevenueData[] = monthlyResults.map((data, index) => ({
        month: `Tháng ${index + 1}`,
        revenue: data.tongDoanhThu || 0,
        year: year
      }));

      setMonthlyData(formattedData);

      // Set current and last month revenue for comparison
      const currentMonth = dayjs().month() + 1;
      const currentMonthData = monthlyResults[currentMonth - 1];
      const lastMonthData = monthlyResults[currentMonth - 2] || { tongDoanhThu: 0 };

      setCurrentMonthRevenue(currentMonthData?.tongDoanhThu || 0);
      setLastMonthRevenue(lastMonthData?.tongDoanhThu || 0);

    } catch (error) {
      message.error('Không thể tải dữ liệu doanh thu theo tháng');    } finally {
      setLoading(false);
    }
  };

  // Fetch yearly revenue data
  const fetchYearlyRevenue = async () => {
    setLoading(true);
    try {
      const currentYear = dayjs().year();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

      const yearlyPromises = years.map(year =>
        revenueService.getRevenueByYear(year)
      );

      const yearlyResults = await Promise.all(yearlyPromises);

      const formattedData: YearlyRevenueData[] = yearlyResults.map((data, index) => ({
        year: years[index].toString(),
        revenue: data.tongDoanhThu || 0
      }));

      setYearlyData(formattedData);

    } catch (error) {
      message.error('Không thể tải dữ liệu doanh thu theo năm');    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalRevenue();
    if (viewType === 'monthly') {
      fetchMonthlyRevenue(selectedYear);
    } else {
      fetchYearlyRevenue();
    }
  }, [viewType, selectedYear]);

  // Calculate growth rate
  const growthRate = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : '0';

  // Chart configurations
  const lineConfig = {
    data: viewType === 'monthly' ? monthlyData : yearlyData,
    xField: viewType === 'monthly' ? 'month' : 'year',
    yField: 'revenue',
    height: height,
    smooth: true,
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    yAxis: {
      label: {
        formatter: (value: string) => `${parseInt(value).toLocaleString('vi-VN')} VNĐ`,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Doanh thu',
          value: `${datum.revenue.toLocaleString('vi-VN')} VNĐ`,
        };
      },
    },
  };

  const columnConfig = {
    data: viewType === 'monthly' ? monthlyData : yearlyData,
    xField: viewType === 'monthly' ? 'month' : 'year',
    yField: 'revenue',
    height: height,
    columnWidthRatio: 0.8,
    meta: {
      revenue: {
        alias: 'Doanh thu (VNĐ)',
      },
    },
    yAxis: {
      label: {
        formatter: (value: string) => `${parseInt(value).toLocaleString('vi-VN')}`,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Doanh thu',
          value: `${datum.revenue.toLocaleString('vi-VN')} VNĐ`,
        };
      },
    },
  };

  return (
    <div>
      {showTitle && (
        <div style={{ marginBottom: 24 }}>
          <h2>Báo cáo Doanh thu</h2>
          <p>Thống kê doanh thu theo thời gian thực từ hệ thống</p>
        </div>
      )}

      {/* Revenue Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totalRevenue}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              formatter={(value) => `${value?.toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Doanh thu tháng này"
              value={currentMonthRevenue}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
              suffix="VNĐ"
              formatter={(value) => `${value?.toLocaleString('vi-VN')}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tăng trưởng"
              value={parseFloat(growthRate)}
              precision={1}
              valueStyle={{ color: parseFloat(growthRate) >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<RiseOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Select
            value={viewType}
            onChange={setViewType}
            style={{ width: '100%' }}
          >
            <Option value="monthly">Theo tháng</Option>
            <Option value="yearly">Theo năm</Option>
          </Select>
        </Col>
        {viewType === 'monthly' && (
          <Col span={12}>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: '100%' }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = dayjs().year() - 2 + i;
                return (
                  <Option key={year} value={year}>
                    Năm {year}
                  </Option>
                );
              })}
            </Select>
          </Col>
        )}
      </Row>

      {/* Charts Section */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="Biểu đồ đường - Xu hướng doanh thu">
              <Line {...lineConfig} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Biểu đồ cột - So sánh doanh thu">
              <Column {...columnConfig} />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Revenue Data Table */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title={`Dữ liệu doanh thu ${viewType === 'monthly' ? 'theo tháng' : 'theo năm'}`}>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                {viewType === 'monthly' ? (
                  <div>
                    <h3>Doanh thu năm {selectedYear}</h3>
                    {monthlyData.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
                        {monthlyData.map((item, index) => (
                          <Card key={index} size="small">
                            <Statistic
                              title={item.month}
                              value={item.revenue}
                              precision={0}
                              formatter={(value) => `${value?.toLocaleString('vi-VN')}`}
                              suffix="VNĐ"
                              valueStyle={{ fontSize: '14px' }}
                            />
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p>Không có dữ liệu doanh thu</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3>Doanh thu theo năm</h3>
                    {yearlyData.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                        {yearlyData.map((item, index) => (
                          <Card key={index} size="small">
                            <Statistic
                              title={`Năm ${item.year}`}
                              value={item.revenue}
                              precision={0}
                              formatter={(value) => `${value?.toLocaleString('vi-VN')}`}
                              suffix="VNĐ"
                              valueStyle={{ fontSize: '16px' }}
                            />
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p>Không có dữ liệu doanh thu</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default RevenueCharts;
