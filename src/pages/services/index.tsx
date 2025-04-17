import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Services.module.css';
import Link from 'next/link';
import { Menu, Dropdown, message } from 'antd';
import { DownOutlined, ShoppingCartOutlined } from '@ant-design/icons';

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

const formatPrice = (price: number) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const hotelServices: Service[] = [
  {
    id: 1,
    name: "Dịch vụ giặt ủi",
    description: "Giặt ủi quần áo, là ủi theo yêu cầu",
    price: 150000,
    category: "Dịch vụ phòng"
  },
  {
    id: 2,
    name: "Dịch vụ Spa",
    description: "Massage, chăm sóc da, tắm dưỡng sinh",
    price: 850000,
    category: "Làm đẹp"
  },
  {
    id: 3,
    name: "Nhà hàng buffet",
    description: "Buffet quốc tế với hơn 100 món ăn",
    price: 450000,
    category: "Ẩm thực"
  },
  {
    id: 4,
    name: "Phòng Gym",
    description: "Phòng tập với trang thiết bị hiện đại",
    price: 200000,
    category: "Thể thao"
  },
  {
    id: 5,
    name: "Hồ bơi vô cực",
    description: "Hồ bơi ngoài trời với view thành phố",
    price: 120000,
    category: "Thể thao"
  },
  {
    id: 6,
    name: "Dịch vụ đưa đón sân bay",
    description: "Xe sang đưa đón tận nơi",
    price: 750000,
    category: "Di chuyển"
  },
  {
    id: 7,
    name: "Bar & Lounge",
    description: "Cocktail & đồ uống cao cấp",
    price: 250000,
    category: "Giải trí"
  },
  {
    id: 8,
    name: "Phòng họp",
    description: "Phòng họp được trang bị đầy đủ thiết bị",
    price: 1500000,
    category: "Hội nghị"
  },
  {
    id: 9,
    name: "Dịch vụ trông trẻ",
    description: "Nhân viên chuyên nghiệp chăm sóc trẻ",
    price: 300000,
    category: "Gia đình"
  },
  {
    id: 10,
    name: "Mini Bar",
    description: "Đồ uống và snack trong phòng",
    price: 100000,
    category: "Dịch vụ phòng"
  }
];

export default function Services() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState('highest');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartVisible, setIsCartVisible] = useState(false);

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
    message.success(`Đã thêm ${service.name} vào giỏ dịch vụ`);
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
    // Implement payment logic here
    router.push({
      pathname: '/payment',
      query: { 
        items: JSON.stringify(cart),
        total: getTotalAmount()
      }
    });
  };

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
                  <span className={styles.cartItemPrice}>{formatPrice(item.price)} đ</span>
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
              <span className={styles.totalAmount}>{formatPrice(getTotalAmount())} đ</span>
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

  const categories = ['all', ...new Set(hotelServices.map(service => service.category))];
  const filteredServices = hotelServices
    .filter(service => selectedCategory === 'all' || service.category === selectedCategory)
    .sort((a, b) => {
      if (sortOption === 'highest') return b.price - a.price;
      if (sortOption === 'lowest') return a.price - b.price;
      return 0;
    });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <span>NHÓM 5</span>
          </Link>
          <div className={styles.userSection}>
            <Dropdown 
              overlay={cartMenu} 
              trigger={['click']}
              visible={isCartVisible}
              onVisibleChange={setIsCartVisible}
            >
              <div className={styles.cartButton}>
                <ShoppingCartOutlined />
                {cart.length > 0 && (
                  <span className={styles.cartBadge}>{cart.length}</span>
                )}
              </div>
            </Dropdown>
            <Dropdown overlay={userMenu} trigger={['click']}>
              <div className={styles.userProfile}>
                <span className={styles.userInitial}>N</span>
                <span className={styles.userName}>Nguyễn Trung Tài</span>
                <DownOutlined style={{ fontSize: '12px', color: '#666' }} />
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

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

          <div className={styles.categoryFilter}>
            <h2>Danh mục dịch vụ</h2>
            <div className={styles.categoryOptions}>
              {categories.map(category => (
                <label key={category} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={selectedCategory === category}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                  <span>{category === 'all' ? 'Tất cả dịch vụ' : category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.servicesList}>
          <h1>Dịch vụ khách sạn</h1>
          <div className={styles.servicesGrid}>
            {filteredServices.map((service) => (
              <div key={service.id} className={styles.serviceCard}>
                <div className={styles.serviceInfo}>
                  <h3>{service.name}</h3>
                  <p className={styles.description}>{service.description}</p>
                  <div className={styles.serviceDetails}>
                    <span className={styles.category}>{service.category}</span>
                    <span className={styles.price}>
                      {formatPrice(service.price)} đ
                    </span>
                  </div>
                  <button 
                    className={styles.bookButton}
                    onClick={() => addToCart(service)}
                  >
                    Thêm dịch vụ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}