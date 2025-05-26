import React, { useState, useEffect } from 'react';
import { Drawer, Menu, Button, Space, Avatar, Typography } from 'antd';
import { 
  MenuOutlined, 
  HomeOutlined, 
  UserOutlined, 
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  CloseOutlined,
  TeamOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';

const { Text } = Typography;

interface MobileNavigationProps {
  userInfo?: {
    tenTK?: string;
    hoTen?: string;
    maVaiTro?: number;
  };
  onLogout?: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  userInfo,
  onLogout
}) => {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleMenuClick = (path: string) => {
    router.push(path);
    setVisible(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setVisible(false);
  };

  // Menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      {
        key: 'home',
        icon: <HomeOutlined />,
        label: 'Trang chủ',
        path: '/'
      },
      {
        key: 'rooms',
        icon: <ShopOutlined />,
        label: 'Phòng',
        path: '/rooms'
      },
      {
        key: 'services',
        icon: <SettingOutlined />,
        label: 'Dịch vụ',
        path: '/services'
      }
    ];

    if (!userInfo) {
      return [
        ...commonItems,
        {
          key: 'login',
          icon: <UserOutlined />,
          label: 'Đăng nhập',
          path: '/login'
        }
      ];
    }

    // Logged in user items
    const userItems = [
      ...commonItems,
      {
        key: 'bookings',
        icon: <CalendarOutlined />,
        label: 'Đặt phòng của tôi',
        path: '/bookings'
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Thông tin cá nhân',
        path: '/profile'
      }
    ];

    // Admin/Staff additional items
    if (userInfo.maVaiTro === 1 || userInfo.maVaiTro === 2) {
      userItems.push({
        key: 'admin',
        icon: <TeamOutlined />,
        label: userInfo.maVaiTro === 1 ? 'Quản trị' : 'Nhân viên',
        path: userInfo.maVaiTro === 1 ? '/admin' : '/staff'
      });
    }

    return userItems;
  };

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        type="text"
        icon={<MenuOutlined />}
        onClick={() => setVisible(true)}
        className="touch-target"
        style={{
          fontSize: '18px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />

      {/* Mobile Navigation Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <div>
              <Text strong style={{ fontSize: '16px' }}>
                {userInfo?.hoTen || 'Khách'}
              </Text>
              {userInfo && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {userInfo.maVaiTro === 1 ? 'Quản trị viên' : 
                     userInfo.maVaiTro === 2 ? 'Nhân viên' : 'Khách hàng'}
                  </Text>
                </div>
              )}
            </div>
          </div>
        }
        placement="left"
        width="280px"
        onClose={() => setVisible(false)}
        open={visible}
        closeIcon={<CloseOutlined />}
        headerStyle={{
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: '16px'
        }}
        bodyStyle={{
          padding: 0
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[router.pathname.split('/')[1] || 'home']}
          style={{ border: 'none' }}
        >
          {getMenuItems().map(item => (
            <Menu.Item
              key={item.key}
              icon={item.icon}
              onClick={() => handleMenuClick(item.path)}
              style={{
                height: '48px',
                lineHeight: '48px',
                margin: '4px 0',
                borderRadius: '8px'
              }}
            >
              {item.label}
            </Menu.Item>
          ))}
          
          {userInfo && (
            <>
              <Menu.Divider />
              <Menu.Item
                key="logout"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  height: '48px',
                  lineHeight: '48px',
                  margin: '4px 0',
                  borderRadius: '8px',
                  color: '#ff4d4f'
                }}
              >
                Đăng xuất
              </Menu.Item>
            </>
          )}
        </Menu>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Nhóm 5 Hotel Management
          </Text>
        </div>
      </Drawer>
    </>
  );
};

export default MobileNavigation;
