import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../../styles/Services.module.css';
import Link from 'next/link';
import { Menu, Dropdown, message, Badge, Button } from 'antd';
import { DownOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Layout from '../../components/Layout';

interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

interface CartItem {
  service: Service;
  quantity: number;
}

const formatPrice = (price: number): string => {
  return `${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
};

const hotelServices: Service[] = [
  {
    id: 1,
    title: "Dịch vụ dọn phòng tiêu chuẩn",
    description: "Dọn dẹp toàn diện phòng của bạn, bao gồm gấp giường, hút bụi, lau chùi và vệ sinh phòng tắm.",
    price: 350000,
    category: "Dọn dẹp",
    imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 2,
    title: "Dịch vụ đưa đón cao cấp",
    description: "Dịch vụ tài xế riêng bằng xe sang cho việc đưa đón sân bay hoặc tham quan thành phố.",
    price: 899000,
    category: "Di chuyển",
    imageUrl: "https://images.unsplash.com/photo-1517520287167-4bbf64a00d66?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 3,
    title: "Ăn uống tại phòng",
    description: "Thực đơn đa dạng được chuẩn bị bởi đầu bếp nổi tiếng và phục vụ trực tiếp tại phòng của bạn.",
    price: 455000,
    category: "Ẩm thực",
    imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 4,
    title: "Dịch vụ Spa",
    description: "Massage và liệu pháp spa thư giãn được thực hiện bởi chuyên gia có chứng nhận.",
    price: 1200000,
    category: "Sức khỏe",
    imageUrl: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 5,
    title: "Dịch vụ lễ tân",
    description: "Hỗ trợ cá nhân hóa cho việc đặt vé, đặt chỗ và sắp xếp các trải nghiệm đặc biệt trong thời gian lưu trú.",
    price: 250000,
    category: "Hỗ trợ",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 6,
    title: "Trung tâm doanh nhân",
    description: "Truy cập vào trung tâm doanh nhân đầy đủ tiện nghi với internet tốc độ cao, máy in và phòng họp.",
    price: 500000,
    category: "Kinh doanh",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
  },
];

const Services = () => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(hotelServices);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState<{[key: number]: boolean}>({});

  const categories = Array.from(new Set(services.map(service => service.category)));

  const filteredServices = services.filter(service => {
    const matchesTerm = service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'all' || service.category === selectedCategory;
    return matchesTerm && matchesCategory;
  }).sort((a, b) => {
    if (sortOrder === 'highest') {
      return b.price - a.price;
    } else {
      return a.price - b.price;
    }
  });

  const handleAddToCart = (service: Service) => {
    setAddingToCart(prev => ({ ...prev, [service.id]: true }));
    
    setTimeout(() => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.service.id === service.id);
        
        if (existingItem) {
          return prevCart.map(item => 
            item.service.id === service.id 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        } else {
          return [...prevCart, { service, quantity: 1 }];
        }
      });
      
      message.success(`Đã thêm ${service.title} vào giỏ hàng`);
      setAddingToCart(prev => ({ ...prev, [service.id]: false }));
    }, 500);
  };

  const updateQuantity = (serviceId: number, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.service.id === serviceId) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) {
            // Remove item if quantity becomes 0 or negative
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.service.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      message.warning('Vui lòng đăng nhập để tiếp tục thanh toán');
      router.push('/login?redirect=services');
      return;
    }
    
    if (cart.length === 0) {
      message.warning('Giỏ hàng của bạn đang trống');
      return;
    }
    
    // Chuyển đổi dữ liệu giỏ hàng sang format phù hợp với trang thanh toán
    const paymentItems = cart.map(item => ({
      id: item.service.id,
      name: item.service.title,
      description: item.service.description,
      price: item.service.price,
      category: item.service.category,
      quantity: item.quantity
    }));
    
    // Chuyển đến trang thanh toán với dữ liệu giỏ hàng
    router.push({
      pathname: '/payment',
      query: { 
        items: JSON.stringify(paymentItems)
      }
    });
  };

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

  return (
    <Layout>
      <div className={styles.container}>
        <Head>
          <title>Dịch vụ khách sạn</title>
          <meta name="description" content="Duyệt và đặt các dịch vụ khách sạn cao cấp của chúng tôi" />
        </Head>

        <h1 className={styles.title}>Dịch vụ khách sạn</h1>

        <div className={styles.filterContainer}>
          <input
            type="text"
            className={styles.searchBar}
            placeholder="Tìm kiếm dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className={styles.categoryFilter}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className={styles.cartButton}>
            <Badge count={cart.reduce((total, item) => total + item.quantity, 0)} showZero>
              <Button 
                type="primary"
                icon={<ShoppingCartOutlined />} 
                onClick={() => setShowCart(true)}
                size="large"
              >
                Giỏ hàng
              </Button>
            </Badge>
          </div>
        </div>
        
        <div className={styles.servicesContainer}>
          <div className={styles.filterSection}>
            <h2>Sắp xếp kết quả</h2>
            <div className={styles.sortOptions}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="highest"
                  checked={sortOrder === 'highest'}
                  onChange={() => setSortOrder('highest')}
                />
                <span>Giá cao nhất</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="lowest"
                  checked={sortOrder === 'lowest'}
                  onChange={() => setSortOrder('lowest')}
                />
                <span>Giá thấp nhất</span>
              </label>
            </div>

            <div className={styles.categoryFilter}>
              <h2>Danh mục dịch vụ</h2>
              <div className={styles.categoryOptions}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="category"
                    value="all"
                    checked={selectedCategory === 'all'}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                  <span>Tất cả dịch vụ</span>
                </label>
                {categories.filter(c => c !== 'all').map(category => (
                  <label key={category} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={selectedCategory === category}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.servicesList}>
            <div className={styles.servicesGrid}>
              {filteredServices.map((service) => (
                <div key={service.id} className={styles.serviceCard}>
                  <div className={styles.serviceBanner}>
                    <Image
                      src={service.imageUrl}
                      alt={service.title}
                      className={styles.serviceImage}
                      width={400}
                      height={200}
                    />
                  </div>
                  <div className={styles.serviceCardContent}>
                    <div className={styles.serviceInfo}>
                      <h3 className={styles.serviceTitle}>{service.title}</h3>
                      <p className={styles.serviceDescription}>{service.description}</p>
                      <span className={styles.serviceCategory}>{service.category}</span>
                    </div>
                    <div className={styles.serviceFooter}>
                      <span className={styles.price}>{formatPrice(service.price)}</span>
                      <button 
                        className={styles.addButton}
                        onClick={() => handleAddToCart(service)}
                        disabled={addingToCart[service.id]}
                      >
                        {addingToCart[service.id] ? 'Đang thêm...' : 'Thêm vào giỏ'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal giỏ hàng */}
        {showCart && (
          <div className={styles.modalOverlay} onClick={() => setShowCart(false)}>
            <div className={styles.cartModal} onClick={e => e.stopPropagation()}>
              <h2 className={styles.cartTitle}>Giỏ dịch vụ của bạn</h2>
              
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>Giỏ dịch vụ trống</div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.service.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <h4>{item.service.title}</h4>
                        <div className={styles.cartItemPrice}>{formatPrice(item.service.price)}</div>
                      </div>
                      <div className={styles.cartQuantity}>
                        <button 
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.service.id, -1)}
                        >
                          -
                        </button>
                        <span className={styles.quantityCount}>{item.quantity}</span>
                        <button 
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.service.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className={styles.cartTotal}>
                    <div>Tổng tiền:</div>
                    <div className={styles.totalAmount}>{formatPrice(calculateTotal())}</div>
                  </div>

                  <button 
                    className={styles.checkoutButton}
                    onClick={handleCheckout}
                  >
                    {isAuthenticated() ? 'Tiến hành thanh toán' : 'Đăng nhập để thanh toán'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Services;