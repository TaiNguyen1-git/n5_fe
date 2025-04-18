import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Services.module.css';
import Link from 'next/link';
import { Menu, Dropdown, message, Badge } from 'antd';
import { DownOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Navbar from '../../components/navbar';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface CartItem extends Service {
  quantity: number;
}

const hotelServices: Service[] = [
  {
    id: 1,
    name: 'Dịch vụ Spa',
    description: 'Trải nghiệm spa cao cấp với các liệu pháp thư giãn và làm đẹp',
    price: 500000,
    category: 'Spa & Wellness'
  },
  {
    id: 2,
    name: 'Dịch vụ Giặt ủi',
    description: 'Giặt ủi quần áo theo tiêu chuẩn 5 sao',
    price: 100000,
    category: 'Dịch vụ phòng'
  },
  {
    id: 3,
    name: 'Dịch vụ Đưa đón',
    description: 'Đưa đón sân bay và các địa điểm theo yêu cầu',
    price: 800000,
    category: 'Di chuyển'
  },
  {
    id: 4,
    name: 'Dịch vụ Ăn uống',
    description: 'Phục vụ ăn uống tại phòng 24/7',
    price: 200000,
    category: 'Ẩm thực'
  },
  {
    id: 5,
    name: 'Dịch vụ Hồ bơi',
    description: 'Sử dụng hồ bơi vô cực và phòng xông hơi',
    price: 300000,
    category: 'Giải trí'
  },
  {
    id: 6,
    name: 'Dịch vụ Gym',
    description: 'Sử dụng phòng tập với trang thiết bị hiện đại',
    price: 200000,
    category: 'Giải trí'
  },
  {
    id: 7,
    name: 'Dịch vụ Massage',
    description: 'Massage thư giãn với các liệu pháp truyền thống và hiện đại',
    price: 450000,
    category: 'Spa & Wellness'
  },
  {
    id: 8,
    name: 'Dịch vụ Dọn phòng',
    description: 'Dọn dẹp phòng hàng ngày theo tiêu chuẩn 5 sao',
    price: 150000,
    category: 'Dịch vụ phòng'
  },
  {
    id: 9,
    name: 'Dịch vụ Thuê xe',
    description: 'Thuê xe sang trọng có tài xế riêng',
    price: 1200000,
    category: 'Di chuyển'
  },
  {
    id: 10,
    name: 'Dịch vụ Tiệc',
    description: 'Tổ chức tiệc cưới, sinh nhật và sự kiện',
    price: 5000000,
    category: 'Ẩm thực'
  },
  {
    id: 11,
    name: 'Dịch vụ Yoga',
    description: 'Lớp học yoga với huấn luyện viên chuyên nghiệp',
    price: 250000,
    category: 'Giải trí'
  },
  {
    id: 12,
    name: 'Dịch vụ Làm tóc',
    description: 'Cắt, uốn, nhuộm tóc với thợ chuyên nghiệp',
    price: 350000,
    category: 'Spa & Wellness'
  },
  {
    id: 13,
    name: 'Dịch vụ Giặt khô',
    description: 'Giặt khô quần áo cao cấp',
    price: 180000,
    category: 'Dịch vụ phòng'
  },
  {
    id: 14,
    name: 'Dịch vụ Thuê xe đạp',
    description: 'Thuê xe đạp tham quan thành phố',
    price: 100000,
    category: 'Di chuyển'
  },
  {
    id: 15,
    name: 'Dịch vụ Nấu ăn riêng',
    description: 'Đầu bếp riêng nấu ăn theo yêu cầu',
    price: 800000,
    category: 'Ẩm thực'
  },
  {
    id: 16,
    name: 'Dịch vụ Karaoke',
    description: 'Phòng karaoke riêng với thiết bị hiện đại',
    price: 600000,
    category: 'Giải trí'
  }
];

export default function Services() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [sortOption, setSortOption] = useState<string>('highest');
  const [isCartVisible, setIsCartVisible] = useState(false);

  const categories = ['all', ...new Set(hotelServices.map(service => service.category))];
  const filteredServices = hotelServices
    .filter(service => selectedCategory === 'all' || service.category === selectedCategory)
    .sort((a, b) => {
      if (sortOption === 'highest') return b.price - a.price;
      if (sortOption === 'lowest') return a.price - b.price;
      return 0;
    });

  const addToCart = (service: Service) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === service.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== serviceId));
  };

  const updateQuantity = (serviceId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === serviceId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePayment = () => {
    // Check if user is authenticated first, redirect to login if not
    if (!isAuthenticated()) {
      // Save cart to localStorage for use after login
      localStorage.setItem('pendingServiceCart', JSON.stringify(cart));
      
      // Redirect to login page with return URL
      redirectToLoginIfNotAuthenticated('/services');
      return;
    }
    
    // Implement payment logic here
  };

  // Check for pending cart on component mount (in case user just logged in)
  useEffect(() => {
    if (isAuthenticated()) {
      const pendingCartStr = localStorage.getItem('pendingServiceCart');
      if (pendingCartStr) {
        try {
          const pendingCart = JSON.parse(pendingCartStr);
          setCart(pendingCart);
          localStorage.removeItem('pendingServiceCart');
          message.success('Giỏ dịch vụ của bạn đã được khôi phục');
        } catch (e) {
          console.error('Error parsing pending cart:', e);
        }
      }
    }
  }, []);

  const cartMenu = (
    <div className={styles.cartDropdown}>
      <h3>Giỏ dịch vụ</h3>
      {cart.length === 0 ? (
        <p className={styles.emptyCart}>Chưa có dịch vụ nào được chọn</p>
      ) : (
        <>
          <div className={styles.cartItems}>
            {cart.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <h4>{item.name}</h4>
                  <span className={styles.cartItemPrice}>{item.price.toLocaleString('en-US')} đ</span>
                </div>
                <div className={styles.cartItemActions}>
                  <button 
                    className={styles.quantityBtn}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    className={styles.quantityBtn}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button 
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.cartFooter}>
            <div className={styles.cartTotal}>
              <span>Tổng tiền:</span>
              <span className={styles.totalAmount}>{getTotalAmount().toLocaleString('en-US')} đ</span>
            </div>
            <button 
              className={styles.paymentButton}
              onClick={handlePayment}
            >
              Thanh toán
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Handle cart icon click in navbar
  const handleCartIconClick = () => {
    setIsCartVisible(!isCartVisible);
  };

  return (
    <div className={styles.container}>
      <Navbar 
        cart={cart}
        onCartClick={handleCartIconClick}
        cartMenu={cartMenu}
      />
      
      <div className={styles.servicesContainer}>
        <div className={styles.filterSection}>
          <h2>Sắp xếp kết quả</h2>
          <div className={styles.sortOptions}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="sort"
                value="highest"
                checked={sortOption === 'highest'}
                onChange={(e) => setSortOption(e.target.value)}
              />
              <span>Giá cao nhất</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="sort"
                value="lowest"
                checked={sortOption === 'lowest'}
                onChange={(e) => setSortOption(e.target.value)}
              />
              <span>Giá thấp nhất</span>
            </label>
          </div>
        </div>

        <div className={styles.servicesSection}>
          <div className={styles.header}>
            <h1>Dịch vụ khách sạn</h1>
            <button 
              className={styles.cartButton}
              onClick={() => setShowCart(!showCart)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={styles.cartCount}>{cart.length}</span>
            </button>
          </div>

          <div className={styles.servicesGrid}>
            {filteredServices.map(service => (
              <div key={service.id} className={styles.serviceCard}>
                <div className={styles.serviceInfo}>
                  <div className={styles.serviceHeader}>
                    <h3>{service.name}</h3>
                    <span className={styles.category}>{service.category}</span>
                  </div>
                  <p>{service.description}</p>
                  <div className={styles.serviceFooter}>
                    <span className={styles.price}>{service.price.toLocaleString('en-US')} đ</span>
                    <button 
                      className={styles.addButton}
                      onClick={() => addToCart(service)}
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCart && (
        <div className={styles.cartSidebar}>
          <div className={styles.cartHeader}>
            <h2>Giỏ dịch vụ</h2>
            <button 
              className={styles.closeButton}
              onClick={() => setShowCart(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className={styles.cartItems}>
            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Giỏ hàng trống</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <h4>{item.name}</h4>
                    <p>{item.price.toLocaleString('en-US')} đ</p>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.quantity}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={() => removeFromCart(item.id)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.cartFooter}>
            <div className={styles.total}>
              <span>Tổng tiền:</span>
              <span className={styles.totalAmount}>{getTotalAmount().toLocaleString('en-US')} đ</span>
            </div>
            <button 
              className={styles.checkoutButton}
              onClick={handlePayment}
              disabled={cart.length === 0}
            >
              Thanh toán
            </button>
          </div>
        </div>
      )}
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>Về chúng tôi</h3>
            <p>Khách sạn Nhóm 5 - Nơi nghỉ dưỡng lý tưởng với không gian sang trọng, tiện nghi hiện đại và dịch vụ chất lượng cao.</p>
            <div className={styles.socialLinks}>
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Liên kết nhanh</h3>
            <ul>
              <li><a href="/">Trang chủ</a></li>
              <li><a href="/rooms">Phòng</a></li>
              <li><a href="/services">Dịch vụ</a></li>
              <li><a href="/about">Giới thiệu</a></li>
              <li><a href="/contact">Liên hệ</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Dịch vụ</h3>
            <ul>
              <li><a href="#">Đặt phòng</a></li>
              <li><a href="#">Nhà hàng</a></li>
              <li><a href="#">Spa & Wellness</a></li>
              <li><a href="#">Hội nghị & Sự kiện</a></li>
              <li><a href="#">Dịch vụ đặc biệt</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Liên hệ</h3>
            <p>10 Huỳnh Thúc Kháng, Tân Phú, Biên Hòa, Đồng Nai</p>
            <p>Điện thoại: (0251) 382 2288</p>
            <p>Email: info@lhu.edu.vn</p>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Khách sạn Nhóm 5. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}