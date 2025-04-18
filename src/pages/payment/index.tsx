import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
<<<<<<< HEAD
import styles from '../../styles/Payment.module.css';
import Header from '../../components/Header';
=======
import { Form, Radio, Input, message, Dropdown, Menu } from 'antd';
import { CreditCardOutlined, DollarOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import styles from '@/styles/Payment.module.css';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Navbar from '../../components/navbar';
>>>>>>> 0e40bf244820ea157d53286fa01b28fb00ac10f9

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

  // Check authentication on page load
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      message.error('Vui lòng đăng nhập để tiếp tục thanh toán');
      redirectToLoginIfNotAuthenticated('/payment');
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
    <div className={styles.container}>
<<<<<<< HEAD
      <Header />
      
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Thanh toán</h1>
=======
      <Navbar />

      <div className={styles.paymentContainer}>
        <div className={styles.orderSummary}>
          <h2>Thông tin đơn hàng</h2>
>>>>>>> 0e40bf244820ea157d53286fa01b28fb00ac10f9
          
          <div className={styles.grid}>
            <div className={styles.orderSummary}>
              <h2>Thông tin đơn hàng</h2>
              
              <div className={styles.cartItems}>
                {cartItems.map(item => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.itemInfo}>
                      <h3>{item.name}</h3>
                      <p className={styles.category}>{item.category}</p>
                    </div>
                    <div className={styles.itemDetails}>
                      <div className={styles.quantity}>
                        <span>Số lượng: {item.quantity}</span>
                      </div>
                      <div className={styles.price}>
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.total}>
                <span>Tổng tiền:</span>
                <span className={styles.totalAmount}>{formatPrice(total)}</span>
              </div>
            </div>
            
            <form className={styles.paymentForm} onSubmit={handleSubmit}>
              <div className={styles.formSection}>
                <h2>Thông tin cá nhân</h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Họ và tên</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? styles.error : ''}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.fullName && <span className={styles.errorMessage}>{errors.fullName}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? styles.error : ''}
                    placeholder="Nhập email"
                  />
                  {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? styles.error : ''}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="address">Địa chỉ</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={errors.address ? styles.error : ''}
                    placeholder="Nhập địa chỉ"
                  />
                  {errors.address && <span className={styles.errorMessage}>{errors.address}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="city">Thành phố</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={errors.city ? styles.error : ''}
                    placeholder="Nhập thành phố"
                  />
                  {errors.city && <span className={styles.errorMessage}>{errors.city}</span>}
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h2>Phương thức thanh toán</h2>
                
                <div className={styles.formGroup}>
                  <div className={styles.radioGroup}>
                    <label>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit"
                        checked={formData.paymentMethod === 'credit'}
                        onChange={handleInputChange}
                      />
                      Thẻ tín dụng
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={handleInputChange}
                      />
                      Chuyển khoản
                    </label>
                  </div>
                </div>
                
                {formData.paymentMethod === 'credit' && (
                  <div className={styles.creditCardForm}>
                    <div className={styles.formGroup}>
                      <label htmlFor="cardNumber">Số thẻ</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={errors.cardNumber ? styles.error : ''}
                        placeholder="1234 5678 9012 3456"
                        maxLength={16}
                      />
                      {errors.cardNumber && <span className={styles.errorMessage}>{errors.cardNumber}</span>}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="cardExpiry">Ngày hết hạn</label>
                      <input
                        type="text"
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className={errors.cardExpiry ? styles.error : ''}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                      {errors.cardExpiry && <span className={styles.errorMessage}>{errors.cardExpiry}</span>}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="cardCVC">CVV</label>
                      <input
                        type="text"
                        id="cardCVC"
                        name="cardCVC"
                        value={formData.cardCVC}
                        onChange={handleInputChange}
                        className={errors.cardCVC ? styles.error : ''}
                        placeholder="123"
                        maxLength={4}
                      />
                      {errors.cardCVC && <span className={styles.errorMessage}>{errors.cardCVC}</span>}
                    </div>
                  </div>
                )}
                
                {formData.paymentMethod === 'transfer' && (
                  <div className={styles.bankDetails}>
                    <div className={styles.formGroup}>
                      <label htmlFor="bankName">Tên ngân hàng</label>
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className={errors.bankName ? styles.error : ''}
                        placeholder="Nhập tên ngân hàng"
                      />
                      {errors.bankName && <span className={styles.errorMessage}>{errors.bankName}</span>}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="accountNumber">Số tài khoản</label>
                      <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className={errors.accountNumber ? styles.error : ''}
                        placeholder="Nhập số tài khoản"
                      />
                      {errors.accountNumber && <span className={styles.errorMessage}>{errors.accountNumber}</span>}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Display submit error if any */}
              {errors.submit && (
                <div className={styles.bookingError}>
                  {errors.submit}
                </div>
              )}
              
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}