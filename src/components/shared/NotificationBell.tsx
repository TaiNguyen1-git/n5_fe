import React, { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  List,
  Typography,
  Space,
  Empty,
  Divider,
  Tag,
  Tooltip
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ClearOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  DollarOutlined,
  SettingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { notificationService, NotificationItem } from '../../services/notificationService';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface NotificationBellProps {
  size?: 'small' | 'middle' | 'large';
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 'middle',
  placement = 'bottomRight'
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe(setNotifications);

    // Get initial notifications
    setNotifications(notificationService.getNotifications());

    // Request notification permission
    notificationService.requestPermission();

    return unsubscribe;
  }, []);

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

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.markAsRead(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setVisible(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 10); // Show only recent 10

  const dropdownContent = (
    <div style={{
      width: 380,
      maxHeight: 500,
      overflow: 'hidden',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <Text strong style={{ fontSize: '16px' }}>
            Thông báo ({unreadCount} chưa đọc)
          </Text>
        </div>
        <Space size="small" wrap>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleMarkAllAsRead}
              icon={<CheckOutlined />}
              style={{ padding: '0 4px', height: 'auto' }}
            >
              Đánh dấu đã đọc
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleClearAll}
              icon={<ClearOutlined />}
              danger
              style={{ padding: '0 4px', height: 'auto' }}
            >
              Xóa tất cả
            </Button>
          )}
        </Space>
      </div>

      {/* Notification List */}
      <div style={{ maxHeight: 350, overflowY: 'auto', padding: '8px 0' }}>
        {recentNotifications.length === 0 ? (
          <Empty
            description="Không có thông báo nào"
            style={{ padding: '40px 20px' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={recentNotifications}
            split={false}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  margin: '4px 8px',
                  backgroundColor: item.read ? '#fff' : '#f6ffed',
                  borderLeft: `4px solid ${getPriorityColor(item.priority)}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid #f0f0f0'
                }}
                actions={[
                  !item.read && (
                    <Tooltip title="Đánh dấu đã đọc">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="Xóa">
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => handleDelete(item.id, e)}
                      danger
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    />
                  </Tooltip>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '50%'
                    }}>
                      {getNotificationIcon(item.type)}
                    </div>
                  }
                  title={
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <Text
                        strong={!item.read}
                        style={{
                          fontSize: '13px',
                          lineHeight: '1.4',
                          flex: 1,
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.title}
                      </Text>
                      <Tag
                        color={getPriorityColor(item.priority)}
                        size="small"
                        style={{
                          fontSize: '10px',
                          margin: 0,
                          flexShrink: 0,
                          lineHeight: '1.2'
                        }}
                      >
                        {getPriorityText(item.priority)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: '4px' }}>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: '12px',
                          display: 'block',
                          marginBottom: '6px',
                          lineHeight: '1.4',
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.message}
                      </Text>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: '11px',
                          color: '#999'
                        }}
                      >
                        {dayjs(item.timestamp).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <>
          <Divider style={{ margin: '8px 0 0 0' }} />
          <div style={{
            padding: '12px 16px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Hiển thị 10 thông báo gần nhất. Tổng cộng: {notifications.length}
            </Text>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      placement={placement}
      open={visible}
      onOpenChange={setVisible}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          size={size}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
