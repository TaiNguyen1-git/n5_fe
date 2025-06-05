import React from 'react';
import {
  Card,
  Space,
  Result,
  Button
} from 'antd';
import {
  BellOutlined,
  ToolOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const NotificationPanel: React.FC = () => {
  const handleRefresh = () => {
    // Placeholder for future implementation
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>Trung tâm thông báo</span>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            size="small"
          >
            Làm mới
          </Button>
        }
      >
        <Result
          icon={<ToolOutlined style={{ color: '#1890ff' }} />}
          title="Tính năng đang phát triển"
          subTitle="Hệ thống thông báo đang được phát triển và sẽ sớm có mặt. Vui lòng quay lại sau!"
          extra={[
            <Button type="primary" key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
              Kiểm tra cập nhật
            </Button>
          ]}
        />
      </Card>
    </div>
  );
};

export default NotificationPanel;
