import React from 'react';
import { Layout, Row, Col, Typography } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

const Footer: React.FC = () => {
  return (
    <AntFooter style={{ background: '#001529', color: '#fff', padding: '24px 50px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Title level={4} style={{ color: '#fff' }}>Về Chúng Tôi</Title>
          <Text style={{ color: '#fff' }}>
            Chúng tôi cung cấp dịch vụ đặt phòng trực tuyến với chất lượng tốt nhất.
          </Text>
        </Col>
        <Col xs={24} sm={8}>
          <Title level={4} style={{ color: '#fff' }}>Liên Hệ</Title>
          <div style={{ marginBottom: '12px' }}>
            <PhoneOutlined style={{ marginRight: '8px' }} />
            <Text style={{ color: '#fff' }}>+84 123 456 789</Text>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <MailOutlined style={{ marginRight: '8px' }} />
            <Text style={{ color: '#fff' }}>contact@example.com</Text>
          </div>
          <div>
            <EnvironmentOutlined style={{ marginRight: '8px' }} />
            <Text style={{ color: '#fff' }}>123 Đường ABC, Quận XYZ, TP.HCM</Text>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <Title level={4} style={{ color: '#fff' }}>Giờ Làm Việc</Title>
          <Text style={{ color: '#fff', display: 'block' }}>Thứ 2 - Thứ 6: 8:00 - 17:00</Text>
          <Text style={{ color: '#fff', display: 'block' }}>Thứ 7: 8:00 - 12:00</Text>
          <Text style={{ color: '#fff', display: 'block' }}>Chủ nhật: Nghỉ</Text>
        </Col>
      </Row>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Text style={{ color: '#fff' }}>© 2024 Hotel Booking. All rights reserved.</Text>
      </div>
    </AntFooter>
  );
};

export default Footer; 