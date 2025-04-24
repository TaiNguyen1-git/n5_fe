import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Radio, Input, message, Dropdown, Menu, Card, Divider, Steps, Button, Row, Col, Badge } from 'antd';
import { CreditCardOutlined, DollarOutlined, CheckCircleOutlined, BankOutlined, SafetyOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, GlobalOutlined, ArrowRightOutlined } from '@ant-design/icons';
import Link from 'next/link';
import styles from '@/styles/Payment.module.css';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Layout from '../../components/Layout';

interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  quantity: number;
}

interface PaymentForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: 'credit' | 'transfer';
  cardNumber: string;
  cardExpiry: string;
  cardCVC: string;
  bankName: string;
  accountNumber: string;
}

interface PaymentFormErrors extends Partial<PaymentForm> {
  submit?: string;
}

export default function Payment() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [formData, setFormData] = useState<PaymentForm>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    paymentMethod: 'credit',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    bankName: '',
    accountNumber: ''
  });
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { Step } = Steps;

  // Check authentication on page load
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      message.error('Vui lòng đăng nhập để tiếp tục thanh toán');
      redirectToLoginIfNotAuthenticated('/payment');
    } else {
      // Get current user info
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        // Pre-fill form with user data if available
        setFormData(prev => ({
          ...prev,
          fullName: user.fullName || prev.fullName,
          email: user.email || prev.email,
          phone: user.phone || prev.phone
        }));
      }
    }
  }, []);

  useEffect(() => {
    // Lấy thông tin giỏ hàng từ query params
    if (router.query.items) {
      try {
        const items = JSON.parse(router.query.items as string);
        setCartItems(items);
        const totalAmount = items.reduce((sum: number, item: CartItem) => 
          sum + (item.price * item.quantity), 0);
        setTotal(totalAmount);
      } catch (error) {
        console.error('Error parsing cart items:', error);
        router.push('/services');
      }
    }
  }, [router.query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof PaymentForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<PaymentForm> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Vui lòng nhập thành phố';
    }
    
    if (formData.paymentMethod === 'credit') {
      if (!formData.cardNumber.trim()) {
        newErrors.cardNumber = 'Vui lòng nhập số thẻ';
      } else if (!/^[0-9]{16}$/.test(formData.cardNumber)) {
        newErrors.cardNumber = 'Số thẻ không hợp lệ';
      }
      
      if (!formData.cardExpiry.trim()) {
        newErrors.cardExpiry = 'Vui lòng nhập ngày hết hạn';
      } else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.cardExpiry)) {
        newErrors.cardExpiry = 'Định dạng MM/YY';
      }
      
      if (!formData.cardCVC.trim()) {
        newErrors.cardCVC = 'Vui lòng nhập CVV';
      } else if (!/^[0-9]{3,4}$/.test(formData.cardCVC)) {
        newErrors.cardCVC = 'CVV không hợp lệ';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to success page
      router.push({
        pathname: '/payment/success',
        query: { 
          orderId: Math.random().toString(36).substring(2, 15),
          total: total
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Có lỗi xảy ra, vui lòng thử lại'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.content}>
            <h1 className={styles.title}>Thanh Toán</h1>
            
            <Steps current={1} className={styles.steps}>
              <Step title="Giỏ hàng" description="Chọn dịch vụ" />
              <Step title="Thanh toán" description="Nhập thông tin" status="process" />
              <Step title="Hoàn thành" description="Xác nhận đơn" />
            </Steps>
            
            <Divider />
            
            <div className={styles.grid}>
              <div className={styles.orderSummary}>
                <Card 
                  title={<div className={styles.summaryTitle}>Thông tin đơn hàng</div>}
                  bordered={false}
                  className={styles.summaryCard}
                >
                  <div className={styles.cartItems}>
                    {cartItems.map(item => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.itemInfo}>
                          <h3>{item.name}</h3>
                          <Badge 
                            count={item.category} 
                            style={{ backgroundColor: '#108ee9' }} 
                            className={styles.categoryBadge} 
                          />
                        </div>
                        <div className={styles.itemDetails}>
                          <div className={styles.quantity}>
                            <span>x{item.quantity}</span>
                          </div>
                          <div className={styles.price}>
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Divider />
                  
                  <div className={styles.total}>
                    <span>Tổng tiền:</span>
                    <span className={styles.totalAmount}>{formatPrice(total)}</span>
                  </div>
                </Card>
              </div>
              
              <form className={styles.paymentForm} onSubmit={handleSubmit}>
                <Card 
                  title={<div><UserOutlined /> Thông tin cá nhân</div>} 
                  bordered={false}
                  className={styles.formCard}
                >
                  <div className={styles.formSection}>
                    <Row gutter={16}>
                      <Col span={24}>
                        <div className={styles.formGroup}>
                          <label htmlFor="fullName"><UserOutlined /> Họ và tên</label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Nhập họ và tên"
                            className={errors.fullName ? styles.error : ''}
                            size="large"
                            prefix={<UserOutlined />}
                          />
                          {errors.fullName && <span className={styles.errorMessage}>{errors.fullName}</span>}
                        </div>
                      </Col>
                    </Row>
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <div className={styles.formGroup}>
                          <label htmlFor="email"><MailOutlined /> Email</label>
                          <Input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={errors.email ? styles.error : ''}
                            placeholder="example@email.com"
                            size="large"
                            prefix={<MailOutlined />}
                          />
                          {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className={styles.formGroup}>
                          <label htmlFor="phone"><PhoneOutlined /> Số điện thoại</label>
                          <Input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={errors.phone ? styles.error : ''}
                            placeholder="0987654321"
                            size="large"
                            prefix={<PhoneOutlined />}
                          />
                          {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                        </div>
                      </Col>
                    </Row>
                    
                    <Row gutter={16}>
                      <Col span={16}>
                        <div className={styles.formGroup}>
                          <label htmlFor="address"><HomeOutlined /> Địa chỉ</label>
                          <Input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={errors.address ? styles.error : ''}
                            placeholder="Nhập địa chỉ của bạn"
                            size="large"
                            prefix={<HomeOutlined />}
                          />
                          {errors.address && <span className={styles.errorMessage}>{errors.address}</span>}
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className={styles.formGroup}>
                          <label htmlFor="city"><GlobalOutlined /> Thành phố</label>
                          <Input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className={errors.city ? styles.error : ''}
                            placeholder="Nhập thành phố"
                            size="large"
                            prefix={<GlobalOutlined />}
                          />
                          {errors.city && <span className={styles.errorMessage}>{errors.city}</span>}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card>
                
                <Card 
                  title={<div><SafetyOutlined /> Phương thức thanh toán</div>} 
                  bordered={false}
                  className={styles.formCard}
                >
                  <div className={styles.formSection}>
                    <div className={styles.paymentMethods}>
                      <Radio.Group 
                        onChange={(e) => handleInputChange({
                          target: { name: 'paymentMethod', value: e.target.value }
                        } as React.ChangeEvent<HTMLInputElement>)} 
                        value={formData.paymentMethod}
                        className={styles.radioGroup}
                      >
                        <div className={styles.methodOptions}>
                          <Radio value="credit" className={styles.methodRadio}>
                            <div className={styles.methodLabel}>
                              <CreditCardOutlined />
                              <span>Thẻ tín dụng/Ghi nợ</span>
                            </div>
                          </Radio>
                          <Radio value="transfer" className={styles.methodRadio}>
                            <div className={styles.methodLabel}>
                              <BankOutlined />
                              <span>Chuyển khoản ngân hàng</span>
                            </div>
                          </Radio>
                        </div>
                      </Radio.Group>
                    </div>
                    
                    {formData.paymentMethod === 'credit' && (
                      <div className={styles.creditCardForm}>
                        <Row gutter={16}>
                          <Col span={24}>
                            <div className={styles.formGroup}>
                              <label htmlFor="cardNumber"><CreditCardOutlined /> Số thẻ</label>
                              <Input
                                type="text"
                                id="cardNumber"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                className={errors.cardNumber ? styles.error : ''}
                                placeholder="1234 5678 9012 3456"
                                maxLength={16}
                                size="large"
                                prefix={<CreditCardOutlined />}
                              />
                              {errors.cardNumber && <span className={styles.errorMessage}>{errors.cardNumber}</span>}
                            </div>
                          </Col>
                        </Row>
                        
                        <Row gutter={16}>
                          <Col span={12}>
                            <div className={styles.formGroup}>
                              <label htmlFor="cardExpiry">Ngày hết hạn</label>
                              <Input
                                type="text"
                                id="cardExpiry"
                                name="cardExpiry"
                                value={formData.cardExpiry}
                                onChange={handleInputChange}
                                className={errors.cardExpiry ? styles.error : ''}
                                placeholder="MM/YY"
                                maxLength={5}
                                size="large"
                              />
                              {errors.cardExpiry && <span className={styles.errorMessage}>{errors.cardExpiry}</span>}
                            </div>
                          </Col>
                          <Col span={12}>
                            <div className={styles.formGroup}>
                              <label htmlFor="cardCVC">CVV</label>
                              <Input
                                type="text"
                                id="cardCVC"
                                name="cardCVC"
                                value={formData.cardCVC}
                                onChange={handleInputChange}
                                className={errors.cardCVC ? styles.error : ''}
                                placeholder="123"
                                maxLength={4}
                                size="large"
                              />
                              {errors.cardCVC && <span className={styles.errorMessage}>{errors.cardCVC}</span>}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                    
                    {formData.paymentMethod === 'transfer' && (
                      <div className={styles.bankDetails}>
                        <div className={styles.bankTransferInfo}>
                          <p>Chuyển khoản đến tài khoản ngân hàng của chúng tôi với nội dung là email của bạn</p>
                          <div className={styles.bankDetail}>
                            <span>Ngân hàng:</span>
                            <strong>BIDV - Ngân hàng Đầu tư và Phát triển Việt Nam</strong>
                          </div>
                          <div className={styles.bankDetail}>
                            <span>Chủ tài khoản:</span>
                            <strong>CÔNG TY KHÁCH SẠN N5</strong>
                          </div>
                          <div className={styles.bankDetail}>
                            <span>Số tài khoản:</span>
                            <strong>12345678909876</strong>
                          </div>
                        </div>
                        
                        <Row gutter={16}>
                          <Col span={12}>
                            <div className={styles.formGroup}>
                              <label htmlFor="bankName">Tên ngân hàng của bạn</label>
                              <Input
                                type="text"
                                id="bankName"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleInputChange}
                                className={errors.bankName ? styles.error : ''}
                                placeholder="Nhập tên ngân hàng"
                                size="large"
                                prefix={<BankOutlined />}
                              />
                              {errors.bankName && <span className={styles.errorMessage}>{errors.bankName}</span>}
                            </div>
                          </Col>
                          <Col span={12}>
                            <div className={styles.formGroup}>
                              <label htmlFor="accountNumber">Số tài khoản của bạn</label>
                              <Input
                                type="text"
                                id="accountNumber"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleInputChange}
                                className={errors.accountNumber ? styles.error : ''}
                                placeholder="Nhập số tài khoản"
                                size="large"
                              />
                              {errors.accountNumber && <span className={styles.errorMessage}>{errors.accountNumber}</span>}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </div>
                </Card>
                
                {/* Display submit error if any */}
                {errors.submit && (
                  <div className={styles.submitError}>
                    {errors.submit}
                  </div>
                )}
                
                <Button 
                  type="primary"
                  htmlType="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                  size="large"
                  icon={isSubmitting ? null : <ArrowRightOutlined />}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
