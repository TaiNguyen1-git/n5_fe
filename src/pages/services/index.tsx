import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../../styles/Services.module.css';
import Link from 'next/link';
import { Menu, Dropdown, message, Badge, Button, Spin } from 'antd';
import { DownOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { isAuthenticated, redirectToLoginIfNotAuthenticated, getCurrentUser } from '../../services/authService';
import Layout from '../../components/Layout';
import { serviceApi, DichVu } from '../../services/serviceApi';

interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  featured?: boolean;
  badge?: string;
  details?: string[];
}

interface CartItem {
  service: Service;
  quantity: number;
}

const formatPrice = (price: number): string => {
  return `${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
};

// Chuyển đổi từ dữ liệu API sang định dạng của frontend
const mapApiToServiceData = (apiData: DichVu[]): Service[] => {
  return apiData.map(service => {
    let imageUrl = 'https://png.pngtree.com/png-clipart/20230913/original/pngtree-laundry-clipart-an-illustration-of-a-washing-machine-cartoon-vector-png-image_11067540.png';
    let description = service.moTa;
    let title = service.ten;
    let featured = false;
    let badge = '';
    let details: string[] = [];
    
    // Kiểm tra tên dịch vụ để chọn hình ảnh đặc biệt và mô tả
    if (service.ten.toLowerCase().includes('giặt') || service.ten.toLowerCase().includes('ủi')) {
      // Sử dụng hình ảnh minh họa cho dịch vụ giặt ủi
      imageUrl = '';
      featured = true;
      badge = 'Phổ biến';
      
      // Thêm chi tiết dịch vụ
      details = [
      ];
      
      // Nếu mô tả quá ngắn hoặc chỉ là "string", cung cấp mô tả chi tiết hơn
      if (!description || description === "string" || description.length < 10) {
        description = "Dịch vụ giặt ủi cao cấp với thiết bị hiện đại";
      }
      
      // Đảm bảo tên dịch vụ rõ ràng
      if (title === "string" || !title || title.length < 3) {
        title = "Dịch vụ giặt ủi cao cấp";
      }
    }
    // Kiểm tra URL hình ảnh
    else if (service.hinhAnh && service.hinhAnh !== 'string') {
      // Nếu là URL tương đối, thêm domain
      if (service.hinhAnh.startsWith('/')) {
        imageUrl = `https://ptud-web-1.onrender.com${service.hinhAnh}`;
      } 
      // Nếu là URL đầy đủ, sử dụng trực tiếp
      else if (service.hinhAnh.startsWith('http')) {
        imageUrl = service.hinhAnh;
      }
    }
    
    return {
      id: service.maDichVu || 0,
      title,
      description,
      price: service.gia,
      category: 'Dịch vụ', // Sử dụng loại chung nếu không có category từ API
      imageUrl,
      featured,
      badge,
      details
    };
  });
};

const Services = () => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState<{[key: number]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy dữ liệu từ API khi component được mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const apiData = await serviceApi.getAllServices();
        console.log('API data received:', apiData); // Ghi log dữ liệu nhận được
        const mappedServices = mapApiToServiceData(apiData);
        setServices(mappedServices);
        setError(null);
      } catch (err: any) {
        console.error('Lỗi khi lấy dữ liệu dịch vụ:', err);
        setError(err?.message || 'Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

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
          
          {categories.length > 0 && (
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
          )}

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
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <p>Đang tải dịch vụ...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        ) : (
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
                  Giá cao đến thấp
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="sort"
                    value="lowest"
                    checked={sortOrder === 'lowest' || sortOrder === ''}
                    onChange={() => setSortOrder('lowest')}
                  />
                  Giá thấp đến cao
                </label>
              </div>
            </div>

            {filteredServices.length > 0 ? (
              <div className={styles.serviceGrid}>
                {filteredServices.map(service => (
                  <div key={service.id} className={styles.serviceCard}>
                    <div className={styles.serviceImageContainer}>
                      <Image 
                        src={service.imageUrl} 
                        alt={service.title}
                        width={300}
                        height={200}
                        className={styles.serviceImage}
                        unoptimized
                        onError={(e) => {
                          (e.target as any).src = 'https://via.placeholder.com/500?text=Dịch+vụ+khách+sạn';
                        }}
                      />
                      <div className={styles.serviceCategory}>{service.category}</div>
                      {service.badge && (
                        <div className={styles.serviceBadge}>{service.badge}</div>
                      )}
                    </div>
                    <div className={styles.serviceContent}>
                      <h3 className={styles.serviceTitle}>{service.title}</h3>
                      <p className={styles.serviceDescription}>{service.description}</p>
                      
                      {service.details && service.details.length > 0 && (
                        <ul className={styles.serviceDetailsList}>
                          {service.details.map((detail, index) => (
                            <li key={index} className={styles.serviceDetailItem}>{detail}</li>
                          ))}
                        </ul>
                      )}
                      
                      <div className={styles.servicePriceRow}>
                        <span className={styles.servicePrice}>{formatPrice(service.price)}</span>
                        <Button
                          type="primary"
                          onClick={() => handleAddToCart(service)}
                          loading={addingToCart[service.id]}
                        >
                          Thêm vào giỏ
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>Không tìm thấy dịch vụ nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
              </div>
            )}
            
            {/* Modal giỏ hàng */}
            {showCart && (
              <div className={styles.cartModal}>
                <div className={styles.cartContent}>
                  <div className={styles.cartHeader}>
                    <h2>Giỏ hàng của bạn</h2>
                    <button className={styles.closeButton} onClick={() => setShowCart(false)}>×</button>
                  </div>
                  
                  {cart.length > 0 ? (
                    <>
                      <div className={styles.cartItems}>
                        {cart.map(item => (
                          <div key={item.service.id} className={styles.cartItem}>
                            <div className={styles.cartItemImage}>
                              <Image
                                src={item.service.imageUrl}
                                alt={item.service.title}
                                width={80}
                                height={60}
                              />
                            </div>
                            <div className={styles.cartItemInfo}>
                              <h4>{item.service.title}</h4>
                              <p className={styles.itemPrice}>{formatPrice(item.service.price)}</p>
                            </div>
                            <div className={styles.cartItemQuantity}>
                              <button onClick={() => updateQuantity(item.service.id, -1)}>-</button>
                              <span>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.service.id, 1)}>+</button>
                            </div>
                            <div className={styles.cartItemTotal}>
                              {formatPrice(item.service.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className={styles.cartFooter}>
                        <div className={styles.cartTotal}>
                          <span>Tổng cộng:</span>
                          <span className={styles.totalPrice}>{formatPrice(calculateTotal())}</span>
                        </div>
                        <Button type="primary" size="large" onClick={handleCheckout}>
                          Thanh toán
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptyCart}>
                      <p>Giỏ hàng của bạn đang trống</p>
                      <Button type="primary" onClick={() => setShowCart(false)}>
                        Tiếp tục mua sắm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Services;