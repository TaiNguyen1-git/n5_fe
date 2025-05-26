import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, message, Statistic, Badge, Button, Select } from 'antd';
import {
  HomeOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ToolOutlined,
  ReloadOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';
import { apiMethods } from '../../utils/apiUtils';

const { Option } = Select;

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

interface RoomType {
  maLoai: number;
  tenLoai: string;
  giaPhong: number;
}

interface RoomStatusDashboardProps {
  showTitle?: boolean;
  height?: number;
}

// Room status mapping
const ROOM_STATUS_CONFIG = {
  1: { label: 'Phòng trống', color: '#52c41a', icon: <HomeOutlined /> },
  2: { label: 'Đã đặt', color: '#1890ff', icon: <CalendarOutlined /> },
  3: { label: 'Có khách', color: '#fa8c16', icon: <UserOutlined /> },
  4: { label: 'Trả phòng', color: '#722ed1', icon: <CheckCircleOutlined /> },
  5: { label: 'Đang dọn', color: '#eb2f96', icon: <ToolOutlined /> }
};

const RoomStatusDashboard: React.FC<RoomStatusDashboardProps> = ({
  showTitle = true,
  height = 300
}) => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<number | null>(null);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        apiMethods.get('Phong/GetAll?PageNumber=1&PageSize=1000'),
        apiMethods.get('LoaiPhong/GetAll')
      ]);

      // Process rooms data
      if (roomsRes.success && roomsRes.data) {
        const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data.items || [];
        setRooms(roomsData.filter((room: Room) => !room.xoa));
      }

      // Process room types
      if (typesRes.success && typesRes.data) {
        const typesData = Array.isArray(typesRes.data) ? typesRes.data : typesRes.data.items || [];
        setRoomTypes(typesData);
      }

    } catch (error) {
      message.error('Không thể tải dữ liệu trạng thái phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate statistics
  const calculateStatistics = () => {
    let filteredRooms = rooms;

    // Filter by room type
    if (selectedRoomType) {
      filteredRooms = filteredRooms.filter(room => room.loaiPhong?.maLoai === selectedRoomType);
    }

    // Filter by room status
    if (selectedRoomStatus) {
      filteredRooms = filteredRooms.filter(room => room.trangThai === selectedRoomStatus);
    }

    const totalRooms = filteredRooms.length;
    const availableRooms = filteredRooms.filter(room => room.trangThai === 1).length;
    const bookedRooms = filteredRooms.filter(room => room.trangThai === 2).length;
    const occupiedRooms = filteredRooms.filter(room => room.trangThai === 3).length;
    const cleaningRooms = filteredRooms.filter(room => room.trangThai === 5).length;

    const occupancyRate = totalRooms > 0 ? ((bookedRooms + occupiedRooms) / totalRooms * 100).toFixed(1) : '0';

    return {
      totalRooms,
      availableRooms,
      bookedRooms,
      occupiedRooms,
      cleaningRooms,
      occupancyRate
    };
  };

  const stats = calculateStatistics();

  // Prepare chart data
  const statusDistributionData = Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => {
    const count = rooms.filter(room => room.trangThai === parseInt(status)).length;
    return {
      status: config.label,
      count,
      percentage: rooms.length > 0 ? (count / rooms.length * 100).toFixed(1) : '0'
    };
  }).filter(item => item.count > 0);

  const roomTypeData = roomTypes.map(type => {
    const count = rooms.filter(room => room.loaiPhong?.maLoai === type.maLoai).length;
    return {
      type: type.tenLoai,
      count,
      revenue: type.giaPhong
    };
  }).filter(item => item.count > 0);

  return (
    <div>
      {showTitle && (
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>Dashboard Trạng thái Phòng</h2>
            <p style={{ margin: 0, color: '#666' }}>Theo dõi trạng thái phòng theo thời gian thực</p>
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
        <Col span={8}>
          <Select
            placeholder="Lọc theo loại phòng"
            style={{ width: '100%' }}
            onChange={setSelectedRoomType}
            allowClear
          >
            <Option value={null}>Tất cả loại phòng</Option>
            {roomTypes.map(type => (
              <Option key={type.maLoai} value={type.maLoai}>
                {type.tenLoai} - {type.giaPhong.toLocaleString('vi-VN')} VNĐ
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: '100%' }}
            onChange={setSelectedRoomStatus}
            allowClear
          >
            <Option value={null}>Tất cả trạng thái</Option>
            {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => (
              <Option key={status} value={parseInt(status)}>
                <span style={{ color: config.color }}>
                  {config.icon} {config.label}
                </span>
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          <Button
            type="default"
            disabled
            style={{ width: '100%' }}
          >
            Lọc theo ngày (Sắp có)
          </Button>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số phòng"
                value={stats.totalRooms}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Phòng trống"
                value={stats.availableRooms}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã đặt/Có khách"
                value={stats.bookedRooms + stats.occupiedRooms}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tỷ lệ lấp đầy"
                value={stats.occupancyRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: parseFloat(stats.occupancyRate) > 80 ? '#52c41a' : '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="Phân bố trạng thái phòng">
              <Pie
                data={statusDistributionData}
                angleField="count"
                colorField="status"
                radius={0.8}
                height={height}
                label={{
                  type: 'outer',
                  content: '{name}: {percentage}%',
                }}
                interactions={[{ type: 'element-active' }]}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Phòng theo loại">
              <Column
                data={roomTypeData}
                xField="type"
                yField="count"
                height={height}
                columnWidthRatio={0.8}
                meta={{
                  count: { alias: 'Số lượng phòng' },
                  type: { alias: 'Loại phòng' },
                }}
                label={{
                  position: 'top',
                  style: {
                    fill: '#FFFFFF',
                    opacity: 0.6,
                  },
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Room Grid */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Lưới trạng thái phòng">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '8px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {rooms
                  .filter(room => {
                    let match = true;
                    if (selectedRoomType) {
                      match = match && room.loaiPhong?.maLoai === selectedRoomType;
                    }
                    if (selectedRoomStatus) {
                      match = match && room.trangThai === selectedRoomStatus;
                    }
                    return match;
                  })
                  .map(room => {
                    const statusConfig = ROOM_STATUS_CONFIG[room.trangThai as keyof typeof ROOM_STATUS_CONFIG];
                    return (
                      <Card
                        key={room.maPhong}
                        size="small"
                        style={{
                          textAlign: 'center',
                          borderColor: statusConfig?.color || '#d9d9d9',
                          backgroundColor: statusConfig?.color ? `${statusConfig.color}15` : '#f5f5f5'
                        }}
                        styles={{ body: { padding: '8px' } }}
                      >
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                          {statusConfig?.icon}
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                          {room.soPhong || room.tenPhong}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          {room.loaiPhong?.tenLoai}
                        </div>
                        <Badge
                          color={statusConfig?.color}
                          text={statusConfig?.label}
                          style={{ fontSize: '10px' }}
                        />
                      </Card>
                    );
                  })}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Legend */}
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="Chú thích trạng thái">
              <Row gutter={16}>
                {Object.entries(ROOM_STATUS_CONFIG).map(([status, config]) => (
                  <Col key={status} span={4}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge color={config.color} />
                      <span style={{ fontSize: '12px' }}>{config.label}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default RoomStatusDashboard;
