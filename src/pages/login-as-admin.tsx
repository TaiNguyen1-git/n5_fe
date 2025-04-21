import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginAsAdmin } from '../services/authService';
import { Button, Card, Typography, Space } from 'antd';
import { UserOutlined, LoginOutlined } from '@ant-design/icons';
import Head from 'next/head';

const { Title, Text } = Typography;

const LoginAsAdminPage = () => {
  const router = useRouter();

  const handleLoginAsAdmin = () => {
    loginAsAdmin();
    router.push('/admin');
  };

  useEffect(() => {
    // Tự động đăng nhập và chuyển hướng
    handleLoginAsAdmin();
  }, []);

  return (
    <>
      <Head>
        <title>Đăng nhập Admin | Nhóm 5 Hotel</title>
      </Head>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <Card style={{ width: 400, textAlign: 'center', padding: '20px 0' }}>
          <Space direction="vertical" size="large">
            <UserOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={2}>Đăng nhập Admin</Title>
            <Text>Đang đăng nhập với tài khoản Admin...</Text>
            <div>
              <Button 
                type="primary" 
                icon={<LoginOutlined />} 
                size="large"
                onClick={handleLoginAsAdmin}
              >
                Đăng nhập ngay
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    </>
  );
};

export default LoginAsAdminPage;
