import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginAsStaff } from '../services/authService';
import { Button, Card, Typography, Row, Col } from 'antd';
import Head from 'next/head';

const { Title, Text } = Typography;

const LoginAsStaffPage = () => {
  const router = useRouter();

  const handleLoginAsStaff = () => {
    loginAsStaff();
    router.push('/staff');
  };

  return (
    <div style={{ padding: '50px 0', minHeight: '100vh', background: '#f0f2f5' }}>
      <Head>
        <title>Đăng nhập nhân viên | Nhóm 5 Hotel</title>
      </Head>
      <Row justify="center" align="middle">
        <Col xs={22} sm={18} md={12} lg={8}>
          <Card style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <Title level={3}>Đăng nhập với vai trò nhân viên</Title>
              <Text>
                Trang này chỉ dùng để test chức năng quản lý dịch vụ mà không cần backend thực tế
              </Text>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large" 
                onClick={handleLoginAsStaff}
                style={{ 
                  width: '100%', 
                  height: '48px',
                  fontSize: '16px',
                  marginBottom: '15px'
                }}
              >
                Đăng nhập ngay
              </Button>
              
              <div style={{ marginTop: '20px' }}>
                <Text>Sau khi đăng nhập, bạn sẽ được chuyển đến trang quản lý của nhân viên</Text>
              </div>

              <div style={{ marginTop: '20px' }}>
                <Button 
                  type="link" 
                  onClick={() => router.push('/')}
                >
                  Quay lại trang chủ
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginAsStaffPage; 