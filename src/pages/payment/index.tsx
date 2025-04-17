import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Radio, Input, message, Dropdown, Menu } from 'antd';
import { CreditCardOutlined, DollarOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import styles from '@/styles/Payment.module.css';

interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  type: 'service';
  details?: {
    category?: string;
  };
}

const Payment = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const { services } = router.query;
    
    if (services) {
      try {
        const serviceData = JSON.parse(services as string);
        
        // Transform service data
        const serviceItems: OrderItem[] = serviceData.map((service: any) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          quantity: service.quantity || 1,
          type: 'service',
          details: {
            category: service.category
          }
        }));

        setOrderItems(serviceItems);

        // Calculate total
        const total = serviceItems.reduce((acc, item) => {
          return acc + (item.price * item.quantity);
        }, 0);
        
        setTotal(total);
      } catch (error) {
        console.error('Error parsing service data:', error);
        message.error('Có lỗi xảy ra khi tải thông tin dịch vụ');
      }
    }
  }, [router.query]);

  const handleSubmit = async (values: any) => {
    try {
      // Here you would typically send the payment details to your backend
      // For now, we'll just show a success message
      message.success('Thanh toán thành công!');
      
      // Clear the service cart after successful payment
      localStorage.removeItem('serviceCart');
      
      // Redirect to success page
      router.push('/payment/success');
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => router.push('/profile')}>
        Thông tin cá nhân
      </Menu.Item>
      <Menu.Item key="logout" onClick={() => router.push('/login')}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Link href="/">
              <h1 style={{ color: '#FF5722' }}>NHÓM 5</h1>
            </Link>
          </div>
          <div className={styles.headerRight}>
            <Dropdown overlay={userMenu} trigger={['click']}>
              <div className={styles.userProfile}>
                <div className={styles.userInitial}>N</div>
                <span className={styles.userName}>Nguyễn Trung Tài</span>
                <DownOutlined style={{ fontSize: '12px', color: '#666' }} />
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      <div className={styles.paymentContainer}>
        <div className={styles.orderSummary}>
          <h2>Thông tin đơn hàng</h2>
          
          {orderItems.length > 0 ? (
            <div className={styles.section}>
              <h3>Dịch vụ đã chọn</h3>
              <div className={styles.orderItems}>
                {orderItems.map((service) => (
                  <div key={service.id} className={styles.orderItem}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{service.name}</span>
                      <div className={styles.itemDetails}>
                        <span className={styles.itemQuantity}>Số lượng: {service.quantity}</span>
                        <span className={styles.itemPrice}>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(service.price)} x {service.quantity}
                        </span>
                      </div>
                    </div>
                    <span className={styles.itemTotal}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(service.price * service.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Chưa có dịch vụ nào được chọn</p>
            </div>
          )}

          <div className={styles.totalAmount}>
            <span>Tổng cộng</span>
            <span className={styles.total}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(total)}
            </span>
          </div>
        </div>

        <div className={styles.paymentMethods}>
          <h2>Phương thức thanh toán</h2>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <div className={styles.methodSelection}>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <div className={styles.methodOption}>
                  <Radio value="cash">
                    <div className={styles.methodLabel}>
                      <DollarOutlined className={styles.methodIcon} />
                      <div>
                        <h3>Thanh toán tiền mặt</h3>
                        <p>Thanh toán khi nhận phòng</p>
                      </div>
                    </div>
                  </Radio>
                </div>

                <div className={styles.methodOption}>
                  <Radio value="card">
                    <div className={styles.methodLabel}>
                      <CreditCardOutlined className={styles.methodIcon} />
                      <div>
                        <h3>Thanh toán bằng thẻ</h3>
                        <p>Hỗ trợ NAPAS/VISA</p>
                      </div>
                    </div>
                  </Radio>
                </div>
              </Radio.Group>
            </div>

            {paymentMethod === 'card' && (
              <div className={styles.cardDetails}>
                <Form.Item
                  label="Số thẻ"
                  name="cardNumber"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số thẻ' },
                    { pattern: /^[0-9]{16}$/, message: 'Số thẻ không hợp lệ' }
                  ]}
                >
                  <Input placeholder="1234 5678 9012 3456" maxLength={16} />
                </Form.Item>

                <div className={styles.cardRow}>
                  <Form.Item
                    label="Ngày hết hạn"
                    name="expiryDate"
                    rules={[
                      { required: true, message: 'Vui lòng nhập ngày hết hạn' },
                      { pattern: /^(0[1-9]|1[0-2])\/([0-9]{2})$/, message: 'Định dạng MM/YY' }
                    ]}
                  >
                    <Input placeholder="MM/YY" maxLength={5} />
                  </Form.Item>

                  <Form.Item
                    label="CVV"
                    name="cvv"
                    rules={[
                      { required: true, message: 'Vui lòng nhập CVV' },
                      { pattern: /^[0-9]{3,4}$/, message: 'CVV không hợp lệ' }
                    ]}
                  >
                    <Input placeholder="123" maxLength={4} />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Tên chủ thẻ"
                  name="cardholderName"
                  rules={[{ required: true, message: 'Vui lòng nhập tên chủ thẻ' }]}
                >
                  <Input placeholder="NGUYEN VAN A" />
                </Form.Item>
              </div>
            )}

            <button type="submit" className={styles.paymentButton}>
              Xác nhận thanh toán
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Payment;