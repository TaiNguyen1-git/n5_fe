import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Typography, 
  Space, 
  Button, 
  Tag, 
  Empty, 
  Row, 
  Col, 
  Statistic,
  Select,
  Input,
  Divider,
  Tooltip,
  Switch
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ClearOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  DollarOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { notificationService, NotificationItem, NotificationStats } from '../../services/notificationService';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const NotificationPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, urgent: 0, today: 0 });
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setStats(notificationService.getStats());
    });
    
    // Get initial notifications
    setNotifications(notificationService.getNotifications());
    setStats(notificationService.getStats());

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = notifications;

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(n => n.priority === priorityFilter);
    }

    // Read status filter
    if (readFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (readFilter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Search filter
    if (searchText) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchText.toLowerCase()) ||
        n.message.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, typeFilter, priorityFilter, readFilter, searchText]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CalendarOutlined style={{ color: '#1890ff' }} />;
      case 'checkin':
        return <UserOutlined style={{ color: '#52c41a' }} />;
      case 'checkout':
        return <UserOutlined style={{ color: '#faad14' }} />;
      case 'room':
        return <HomeOutlined style={{ color: '#722ed1' }} />;
      case 'revenue':
        return <DollarOutlined style={{ color: '#13c2c2' }} />;
      case 'system':
        return <SettingOutlined style={{ color: '#666' }} />;
      default:
        return <BellOutlined style={{ color: '#666' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#ff4d4f';
      case 'high':
        return '#fa8c16';
      case 'medium':
        return '#1890ff';
      case 'low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Khẩn cấp';
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return 'Bình thường';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'booking':
        return 'Đặt phòng';
      case 'checkin':
        return 'Nhận phòng';
      case 'checkout':
        return 'Trả phòng';
      case 'room':
        return 'Phòng';
      case 'revenue':
        return 'Doanh thu';
      case 'system':
        return 'Hệ thống';
      default:
        return 'Khác';
    }
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleRefresh = () => {
    setLoading(true);
    // Force check for new notifications
    notificationService.startPolling(1000); // Check immediately
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const handleAutoRefreshToggle = (checked: boolean) => {
    setAutoRefresh(checked);
    if (checked) {
      notificationService.startPolling();
    } else {
      notificationService.stopPolling();
    }
  };

  return (
    <div>
      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Tổng thông báo"
            value={stats.total}
            prefix={<BellOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Chưa đọc"
            value={stats.unread}
            valueStyle={{ color: '#1890ff' }}
            prefix={<BellOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Khẩn cấp"
            value={stats.urgent}
            valueStyle={{ color: '#ff4d4f' }}
            prefix={<BellOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Hôm nay"
            value={stats.today}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CalendarOutlined />}
          />
        </Col>
      </Row>

      {/* Main Panel */}
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>Trung tâm thông báo</span>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Tự động làm mới">
              <Switch
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                size="small"
              />
            </Tooltip>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size="small"
            >
              Làm mới
            </Button>
            {stats.unread > 0 && (
              <Button
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                size="small"
              >
                Đánh dấu đã đọc
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearAll}
                danger
                size="small"
              >
                Xóa tất cả
              </Button>
            )}
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Search
              placeholder="Tìm kiếm thông báo..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={8} sm={4}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              placeholder="Loại"
            >
              <Option value="all">Tất cả loại</Option>
              <Option value="booking">Đặt phòng</Option>
              <Option value="checkin">Nhận phòng</Option>
              <Option value="checkout">Trả phòng</Option>
              <Option value="room">Phòng</Option>
              <Option value="revenue">Doanh thu</Option>
              <Option value="system">Hệ thống</Option>
            </Select>
          </Col>
          <Col xs={8} sm={4}>
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: '100%' }}
              placeholder="Độ ưu tiên"
            >
              <Option value="all">Tất cả</Option>
              <Option value="urgent">Khẩn cấp</Option>
              <Option value="high">Cao</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="low">Thấp</Option>
            </Select>
          </Col>
          <Col xs={8} sm={4}>
            <Select
              value={readFilter}
              onChange={setReadFilter}
              style={{ width: '100%' }}
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả</Option>
              <Option value="unread">Chưa đọc</Option>
              <Option value="read">Đã đọc</Option>
            </Select>
          </Col>
        </Row>

        <Divider />

        {/* Notification List */}
        {filteredNotifications.length === 0 ? (
          <Empty 
            description="Không có thông báo nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={filteredNotifications}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thông báo`
            }}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: item.read ? 'transparent' : '#f6ffed',
                  borderLeft: `4px solid ${getPriorityColor(item.priority)}`,
                  padding: '16px',
                  marginBottom: '8px',
                  borderRadius: '4px'
                }}
                actions={[
                  !item.read && (
                    <Tooltip title="Đánh dấu đã đọc">
                      <Button
                        type="text"
                        icon={<CheckOutlined />}
                        onClick={() => handleMarkAsRead(item.id)}
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="Xóa">
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(item.id)}
                      danger
                    />
                  </Tooltip>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item.type)}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong={!item.read}>
                        {item.title}
                      </Text>
                      <Space>
                        <Tag color="blue" size="small">
                          {getTypeText(item.type)}
                        </Tag>
                        <Tag color={getPriorityColor(item.priority)} size="small">
                          {getPriorityText(item.priority)}
                        </Tag>
                      </Space>
                    </div>
                  }
                  description={
                    <div>
                      <Text style={{ display: 'block', marginBottom: '8px' }}>
                        {item.message}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(item.timestamp).format('DD/MM/YYYY HH:mm')} • {dayjs(item.timestamp).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default NotificationPanel;
