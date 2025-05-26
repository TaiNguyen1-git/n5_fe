import React, { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from '../../styles/Services.module.css';
import Link from 'next/link';
import { Button, Spin, Pagination } from 'antd';
import Layout from '../../components/Layout';
import { serviceApi, DichVu, PaginatedResponse, ApiResponse } from '../../services/serviceApi';

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

const formatPrice = (price: number): string => {
  return `${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
};

// Chuyển đổi từ dữ liệu API sang định dạng của frontend
const mapApiToServiceData = (apiData: DichVu[]): Service[] => {
  return apiData.map(service => {
    let description = service.moTa;
    let title = service.ten;
    let featured = false;
    let badge = '';
    let details: string[] = [];
    let category = 'Dịch vụ';

    // Xác định danh mục dựa trên tên dịch vụ
    if (service.ten.toLowerCase().includes('giặt') || service.ten.toLowerCase().includes('ủi')) {
      category = 'Giặt ủi';
      badge = 'Phổ biến';

      // Nếu mô tả quá ngắn hoặc chỉ là "string", cung cấp mô tả chi tiết hơn
      if (!description || description === "string" || description.length < 10) {
        description = "Dịch vụ giặt ủi cao cấp với thiết bị hiện đại";
      }

      // Đảm bảo tên dịch vụ rõ ràng
      if (title === "string" || !title || title.length < 3) {
        title = "Dịch vụ giặt ủi cao cấp";
      }
    } else if (service.ten.toLowerCase().includes('ăn') || service.ten.toLowerCase().includes('buffet')) {
      category = 'Ẩm thực';
      badge = 'Đặc sắc';

      if (!description || description === "string" || description.length < 10) {
        description = "Dịch vụ ẩm thực cao cấp với đa dạng món ăn";
      }
    } else if (service.ten.toLowerCase().includes('spa') || service.ten.toLowerCase().includes('massage')) {
      category = 'Spa & Làm đẹp';
      badge = 'Thư giãn';

      if (!description || description === "string" || description.length < 10) {
        description = "Dịch vụ spa và làm đẹp cao cấp giúp bạn thư giãn";
      }
    } else if (service.ten.toLowerCase().includes('xe') || service.ten.toLowerCase().includes('đưa đón')) {
      category = 'Đưa đón';
      badge = 'Tiện lợi';

      if (!description || description === "string" || description.length < 10) {
        description = "Dịch vụ đưa đón tiện lợi, an toàn";
      }
    }

    // Chọn ảnh mặc định dựa trên danh mục
    let imageUrl = '/images/hotel-lobby.jpg'; // Ảnh mặc định

    if (category === 'Giặt ủi') {
      imageUrl = '/images/hotel-room.jpg';
    } else if (category === 'Ẩm thực') {
      imageUrl = '/images/restaurant.jpg';
    } else if (category === 'Spa & Làm đẹp') {
      imageUrl = '/images/pool.jpg';
    } else if (category === 'Đưa đón') {
      imageUrl = '/images/hotel-exterior.jpg';
    }

    // Nếu có hình ảnh từ API, sử dụng nó thay vì ảnh mặc định
    if (service.hinhAnh && service.hinhAnh !== 'string' && service.hinhAnh.length > 5) {
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
      category,
      imageUrl,
      featured,
      badge,
      details
    };
  });
};

// Tối ưu hóa component với memo
const Services = memo(() => {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12, // 12 services per page for better grid layout
    total: 0,
  });

  // Fetch services with pagination
  const fetchServices = async (pageNumber: number = 1, pageSize: number = 12) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching services: page ${pageNumber}, size ${pageSize}`);

      const response = await serviceApi.getAllServices(pageNumber, pageSize);

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedResponse<DichVu>;

        // Map API data to Service interface
        const mappedServices = mapApiToServiceData(paginatedData.items);

        // Update services and pagination info
        setServices(mappedServices);
        setPagination(prev => ({
          ...prev,
          current: paginatedData.pageNumber,
          pageSize: paginatedData.pageSize,
          total: paginatedData.totalItems,
        }));

        console.log('Services loaded successfully:', mappedServices.length);
      } else {
        throw new Error(response.message || 'Failed to fetch services');
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError(err?.message || 'Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.');

      // Fallback: try to get services without pagination
      try {
        const fallbackData = await serviceApi.getAllServicesNoPagination();
        const mappedServices = mapApiToServiceData(fallbackData);
        setServices(mappedServices);
        setPagination(prev => ({
          ...prev,
          total: mappedServices.length,
        }));
        setError(null);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || pagination.pageSize;
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: newPageSize,
    }));
    fetchServices(page, newPageSize);
  };

  // Load initial data
  useEffect(() => {
    fetchServices(pagination.current, pagination.pageSize);
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
                        src={service.imageUrl || '/images/restaurant.jpg'}
                        alt={service.title}
                        width={300}
                        height={200}
                        className={styles.serviceImage}
                        unoptimized
                        loading="lazy"
                        onError={(e) => {
                          (e.target as any).src = '/images/restaurant.jpg';
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>Không tìm thấy dịch vụ nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                <Button onClick={() => fetchServices(1, pagination.pageSize)}>Thử lại</Button>
              </div>
            )}
          </div>
        )}

        {/* Pagination - Outside of servicesContainer for proper layout */}
        {!loading && !error && filteredServices.length > 0 && (
          <div className={styles.paginationContainer}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} của ${total} dịch vụ`
              }
              onChange={handlePaginationChange}
              onShowSizeChange={handlePaginationChange}
              pageSizeOptions={['6', '12', '24', '48']}
            />
          </div>
        )}
      </div>
    </Layout>
  );
});

export default Services;
