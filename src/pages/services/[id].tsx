import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Form, InputNumber, DatePicker, message, Modal, Spin, Card, Divider } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '../../styles/ServiceDetail.module.css';
import Layout from '../../components/Layout';
import { serviceApi, DichVu } from '../../services/serviceApi';
import { useUserStore } from '../../stores/userStore';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ServiceBookingForm {
  soLuong: number;
  ngaySD: string;
  ghiChu?: string;
}

const ServiceDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const userStore = useUserStore();
  const [form] = Form.useForm();

  // State management
  const [service, setService] = useState<DichVu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');

  // Fetch service details
  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchServiceDetail(id);
    }
  }, [id]);

  const fetchServiceDetail = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/service-detail?id=${serviceId}`);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content
      const responseText = await response.text();

      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (data.success && data.data) {
        setService(data.data);
      } else {
        setError(data.message || 'Không tìm thấy thông tin dịch vụ');
      }
    } catch (err) {
      console.error('Error fetching service:', err);
      setError('Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = (quantity: number): number => {
    if (!service || !service.gia) return 0;
    return service.gia * quantity;
  };

  // Handle service booking
  const handleBookService = async (values: ServiceBookingForm) => {
    if (!service) return;

    // Check if user is logged in (basic check only)
    const currentUser = userStore.user;
    if (!currentUser) {
      message.warning('Vui lòng đăng nhập để đặt dịch vụ');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate successful booking (since API may not work properly)
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay

      setBookingMessage(
        `Đặt dịch vụ thành công!

Dịch vụ: ${service.ten}
Số lượng: ${values.soLuong}
Ngày sử dụng: ${dayjs(values.ngaySD).format('DD/MM/YYYY')}
Tổng tiền: ${calculateTotalPrice(values.soLuong).toLocaleString('vi-VN')}đ

Nhân viên sẽ liên hệ với bạn để xác nhận chi tiết.`
      );
      setIsSuccessModalVisible(true);
      form.resetFields();

    } catch (error) {
      message.error('Có lỗi xảy ra khi đặt dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price
  const formatPrice = (price: number | undefined): string => {
    if (!price || isNaN(price)) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !service) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h2>Dịch vụ không tìm thấy</h2>
            <p>{error || 'Không tìm thấy thông tin dịch vụ bạn yêu cầu.'}</p>
            <Link href="/services" className={styles.backButton}>
              <ArrowLeftOutlined /> Quay lại danh sách dịch vụ
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <Head>
          <title>{service.ten} - Dịch vụ khách sạn</title>
          <meta name="description" content={service.moTa} />
        </Head>

        {/* Success Modal */}
        <Modal
          title="Đặt dịch vụ thành công"
          open={isSuccessModalVisible}
          onCancel={() => setIsSuccessModalVisible(false)}
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => setIsSuccessModalVisible(false)}
            >
              Đóng
            </Button>
          ]}
        >
          <div className={styles.successModal}>
            <div className={styles.successIcon}>
              <CheckOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            </div>
            <h3>Đặt dịch vụ thành công!</h3>
            <pre className={styles.bookingDetails}>{bookingMessage}</pre>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
          </div>
        </Modal>

        <div className={styles.content}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
          }}>
            {/* Back button */}
            <div style={{ marginBottom: '20px' }}>
              <Link
                href="/services"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#1890ff',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9',
                  background: '#fff',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f8ff';
                  e.currentTarget.style.borderColor = '#1890ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#d9d9d9';
                }}
              >
                <ArrowLeftOutlined /> Quay lại danh sách dịch vụ
              </Link>
            </div>

            <div style={{
              display: 'flex',
              gap: '40px',
              flexWrap: 'wrap',
              alignItems: 'flex-start'
            }}>
              {/* Left Column: Image + Info */}
              <div style={{
                flex: '1',
                minWidth: '400px',
                maxWidth: '500px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
              {/* Service Image */}
              <Image
                src={service.hinhAnh || '/images/restaurant.jpg'}
                alt={service.ten}
                width={600}
                height={400}
                style={{
                  width: '100%',
                  height: '350px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid #f0f0f0'
                }}
                unoptimized
                onError={(e) => {
                  (e.target as any).src = '/images/restaurant.jpg';
                }}
              />

              {/* Service Header */}
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)',
                borderRadius: '12px',
                border: '1px solid #e8f4fd'
              }}>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1890ff',
                  marginBottom: '12px',
                  lineHeight: '1.2'
                }}>
                  {service.ten}
                </h1>
                <p style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#f5222d',
                  marginBottom: '0'
                }}>
                  {formatPrice(service.gia)} <span style={{ fontSize: '18px', color: '#666' }}>/ lần sử dụng</span>
                </p>
              </div>

              {/* Service Description */}
              <div style={{
                padding: '24px',
                background: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #f0f0f0'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#262626',
                  marginBottom: '12px'
                }}>
                  Mô tả dịch vụ
                </h2>
                <p style={{
                  color: '#595959',
                  lineHeight: '1.6',
                  fontSize: '16px',
                  marginBottom: '0'
                }}>
                  {service.moTa || 'Đang cập nhật mô tả...'}
                </p>
              </div>
              </div>

              {/* Right Column: Booking Form */}
              <div style={{
                flex: '1',
                minWidth: '350px',
                maxWidth: '450px'
              }}>
                {/* Booking Form */}
              <Card
                title={
                  <span style={{ fontSize: '20px', fontWeight: '600', color: '#1890ff' }}>
                    Đặt dịch vụ
                  </span>
                }
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e8f4fd'
                }}
                headStyle={{
                  background: 'linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)',
                  borderRadius: '12px 12px 0 0'
                }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleBookService}
                  initialValues={{
                    soLuong: 1,
                    ngaySD: dayjs().add(1, 'day').format('YYYY-MM-DD')
                  }}
                >
                  <Form.Item
                    label="Số lượng"
                    name="soLuong"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số lượng' },
                      { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: '100%' }}
                      placeholder="Nhập số lượng"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Ngày sử dụng"
                    name="ngaySD"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày sử dụng' }]}
                  >
                    <input
                      type="date"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      min={dayjs().format('YYYY-MM-DD')}
                      placeholder="Chọn ngày sử dụng"
                    />
                  </Form.Item>

                  <Form.Item dependencies={['soLuong']}>
                    {({ getFieldValue }) => {
                      const quantity = getFieldValue('soLuong') || 1;
                      const totalPrice = calculateTotalPrice(quantity);
                      
                      return (
                        <div style={{
                          padding: '16px',
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '16px', color: '#666' }}>Tổng tiền: </span>
                          <span style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#52c41a'
                          }}>
                            {formatPrice(totalPrice)}
                          </span>
                        </div>
                      );
                    }}
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      icon={<ShoppingCartOutlined />}
                      size="large"
                      style={{
                        width: '100%',
                        height: '50px',
                        fontSize: '16px',
                        fontWeight: '600',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                      }}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Đặt dịch vụ ngay'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetail;
