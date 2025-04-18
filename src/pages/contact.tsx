import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, MessageOutlined } from '@ant-design/icons';
import Layout from '../components/Layout';
import styles from '../styles/Contact.module.css';

const { TextArea } = Input;

const Contact = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // TODO: Implement contact form submission
      console.log('Form values:', values);
      message.success('Gửi liên hệ thành công!');
      form.resetFields();
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại sau!');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className={styles.contactContainer}>
        <div className={styles.contactContent}>
          <h1 className={styles.title}>Liên Hệ Với Chúng Tôi</h1>
          <p className={styles.description}>
            Hãy để lại thông tin liên hệ, chúng tôi sẽ phản hồi sớm nhất có thể.
          </p>
          
          <Form
            form={form}
            name="contact"
            onFinish={onFinish}
            layout="vertical"
            className={styles.contactForm}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Họ và tên" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Email" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="Số điện thoại" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="message"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung tin nhắn!' }]}
            >
              <div style={{ position: 'relative' }}>
                <MessageOutlined style={{ 
                  position: 'absolute', 
                  left: '11px', 
                  top: '11px', 
                  color: '#bfbfbf' 
                }} />
                <TextArea
                  placeholder="Nội dung tin nhắn"
                  rows={4}
                  size="large"
                  style={{ paddingLeft: '30px' }}
                />
              </div>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                className={styles.submitButton}
              >
                Gửi Tin Nhắn
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default Contact; 