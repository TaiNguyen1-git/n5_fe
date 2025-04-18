import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Services.module.css';
import Header from '../../components/Header';

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

  const categories = ['all', ...new Set(hotelServices.map(service => service.category))];

  const filteredServices = selectedCategory === 'all' 
    ? hotelServices 
    : hotelServices.filter(service => service.category === selectedCategory);

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

  const handleCheckout = () => {
    router.push({
      pathname: '/payment',
      query: { 
        items: JSON.stringify(cart),
        total: getTotalAmount()
      }
    });
  };

  // Lấy icon tương ứng với danh mục
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Spa & Wellness':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#0078c2"/>
            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#0078c2"/>
          </svg>
        );
      case 'Dịch vụ phòng':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12H15V22" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'Di chuyển':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17H7C5.89543 17 5 16.1046 5 15V9C5 7.89543 5.89543 7 7 7H9" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 17H17C18.1046 17 19 16.1046 19 15V9C19 7.89543 18.1046 7 17 7H15" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12H15" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'Ẩm thực':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 8H18V17C18 18.0609 17.5786 19.0783 16.8284 19.8284C16.0783 20.5786 15.0609 21 14 21H6C4.93913 21 3.92172 20.5786 3.17157 19.8284C2.42143 19.0783 2 18.0609 2 17V8Z" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 1V3" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 1V3" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 1V3" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'Giải trí':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3H9C7.93913 3 6.92172 3.42143 6.17157 4.17157C5.42143 4.92172 5 5.93913 5 7V17C5 18.0609 5.42143 19.0783 6.17157 19.8284C6.92172 20.5786 7.93913 21 9 21H15C16.0609 21 17.0783 20.5786 17.8284 19.8284C18.5786 19.0783 19 18.0609 19 17V7C19 5.93913 18.5786 4.92172 17.8284 4.17157C17.0783 3.42143 16.0609 3 15 3Z" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9H15" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13H15" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 17H13" stroke="#0078c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Dịch Vụ Khách Sạn</h1>
          <p className={styles.subtitle}>Khám phá các dịch vụ cao cấp được thiết kế để nâng cao trải nghiệm lưu trú của bạn. Từ spa thư giãn đến dịch vụ đưa đón và ẩm thực tinh tế.</p>
        </div>
      </div>
      
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.sidebar}>
            <h2>Danh mục dịch vụ</h2>
            <div className={styles.categories}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className={styles.categoryIcon}>{getCategoryIcon(category)}</span>
                  <span>{category === 'all' ? 'Tất cả dịch vụ' : category}</span>
                </button>
              ))}
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
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
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
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Thanh toán
              </button>
            </div>
          </div>
        )}
      </main>
      
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