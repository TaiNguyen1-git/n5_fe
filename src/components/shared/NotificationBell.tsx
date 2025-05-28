import React, { useState } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Typography,
  Result
} from 'antd';
import {
  BellOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface NotificationBellProps {
  size?: 'small' | 'middle' | 'large';
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 'middle',
  placement = 'bottomRight'
}) => {
  const [visible, setVisible] = useState(false);

  const dropdownContent = (
    <div style={{
      width: 320,
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '16px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <Text strong style={{ fontSize: '16px' }}>
          Thông báo
        </Text>
      </div>

      <Result
        icon={<ToolOutlined style={{ color: '#1890ff' }} />}
        title="Đang phát triển"
        subTitle="Tính năng thông báo đang được phát triển"
        style={{ padding: '20px 0' }}
      />
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
      <Badge count={0} size="small" offset={[-2, 2]}>
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
