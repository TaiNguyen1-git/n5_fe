import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/RoomsList.module.css';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Card,
  Row,
  Col,
  Select,
  Slider,
  Button,
  Input,
  Pagination,
  Spin,
  Empty,
  Tag,
  message
} from 'antd';
import { SearchOutlined, HomeOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

// Định nghĩa kiểu dữ liệu cho phòng
interface Room {
  maPhong: number;
  soPhong: string;
  soNguoi: number;
  hinhAnh?: string;
  moTa?: string;
  trangThai: number;
  loaiPhong?: {
    maLoai: number;
    tenLoai: string;
    giaPhong: number;
  };
  trangThaiPhong?: {
    maTT: number;
    tenTT: string;
  };
  // Các trường bổ sung cho UI
  id?: number;
  tenPhong?: string;
  giaTien?: number;
  loaiPhongText?: string;
  trangThaiText?: string;
  features?: string[];
}

const RoomsPage = () => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Các state cho bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [roomType, setRoomType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Lấy danh sách phòng từ API
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);

      try {
        // Thử lấy dữ liệu từ nhiều endpoint khác nhau
        const endpoints = [
          '/api/rooms',
          '/api/Phong/GetAll',
          'https://ptud-web-1.onrender.com/api/Phong/GetAll'
        ];

        let roomsData: Room[] = [];
        let success = false;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();

              // Xử lý dữ liệu tùy thuộc vào cấu trúc phản hồi
              if (Array.isArray(data)) {
                roomsData = data;
                success = true;
                break;
              } else if (data.items && Array.isArray(data.items)) {
                roomsData = data.items;
                success = true;
                break;
              } else if (data.data && Array.isArray(data.data)) {
                roomsData = data.data;
                success = true;
                break;
              }
            }
          } catch (endpointError) {
            console.error(`Error fetching from ${endpoint}:`, endpointError);
            // Tiếp tục thử endpoint tiếp theo
          }
        }

        if (!success) {
          // Nếu không lấy được dữ liệu từ API, sử dụng dữ liệu mẫu
          roomsData = generateMockRooms();
          message.warning('Không thể kết nối đến máy chủ. Hiển thị dữ liệu mẫu.');
        }

        // Chuẩn hóa dữ liệu phòng
        const normalizedRooms = roomsData.map(room => normalizeRoomData(room));

        setRooms(normalizedRooms);
        setFilteredRooms(normalizedRooms);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setError('Không thể tải danh sách phòng. Vui lòng thử lại sau.');

        // Sử dụng dữ liệu mẫu khi có lỗi
        const mockRooms = generateMockRooms();
        setRooms(mockRooms);
        setFilteredRooms(mockRooms);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Chuẩn hóa dữ liệu phòng từ API
  const normalizeRoomData = (room: any): Room => {
    return {
      maPhong: room.maPhong || room.id || 0,
      id: room.maPhong || room.id || 0,
      soPhong: room.soPhong || `Phòng ${room.maPhong || ''}`,
      tenPhong: room.tenPhong || `Phòng ${room.soPhong || room.maPhong || ''}`,
      soNguoi: room.soNguoi || room.soLuongKhach || 2,
      hinhAnh: room.hinhAnh || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop',
      moTa: room.moTa || 'Thông tin phòng đang được cập nhật',
      trangThai: room.trangThai || room.maTT || 1,
      trangThaiText: getTrangThaiText(room.trangThai || room.maTT || 1),
      giaTien: room.loaiPhong?.giaPhong || room.giaPhong || room.giaTien || 500000,
      loaiPhongText: room.loaiPhong?.tenLoai || room.tenLoai || 'Standard',
      features: ['WiFi', 'TV', 'Điều hòa', 'Minibar']
    };
  };

  // Hàm tạo dữ liệu mẫu khi không có API
  const generateMockRooms = (): Room[] => {
    const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Family'];
    const mockRooms: Room[] = [];

    for (let i = 1; i <= 12; i++) {
      const roomTypeIndex = (i % 4);
      const roomType = roomTypes[roomTypeIndex];
      const price = (roomTypeIndex + 1) * 500000;

      mockRooms.push({
        maPhong: i,
        id: i,
        soPhong: `${100 + i}`,
        tenPhong: `Phòng ${100 + i}`,
        soNguoi: roomTypeIndex === 3 ? 4 : 2,
        hinhAnh: `https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop`,
        moTa: `Phòng ${roomType} thoáng mát, đầy đủ tiện nghi`,
        trangThai: i % 3 === 0 ? 2 : 1,
        trangThaiText: i % 3 === 0 ? 'Đã đặt' : 'Trống',
        giaTien: price,
        loaiPhongText: roomType,
        features: ['WiFi', 'TV', 'Điều hòa', 'Minibar']
      });
    }

    return mockRooms;
  };

  // Hàm lấy text trạng thái phòng
  const getTrangThaiText = (trangThai: number): string => {
    switch (trangThai) {
      case 1: return 'Trống';
      case 2: return 'Đã đặt';
      case 3: return 'Đang sử dụng';
      case 4: return 'Đang dọn dẹp';
      default: return 'Không xác định';
    }
  };

  // Lọc phòng dựa trên các tiêu chí
  useEffect(() => {
    let result = [...rooms];

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      result = result.filter(room =>
        room.tenPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.soPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.moTa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lọc theo khoảng giá
    result = result.filter(room =>
      room.giaTien && room.giaTien >= priceRange[0] && room.giaTien <= priceRange[1]
    );

    // Lọc theo số lượng khách
    if (guestCount) {
      result = result.filter(room => room.soNguoi >= guestCount);
    }

    // Lọc theo loại phòng
    if (roomType) {
      result = result.filter(room => room.loaiPhongText === roomType);
    }

    setFilteredRooms(result);
    setCurrentPage(1);
  }, [searchTerm, priceRange, guestCount, roomType, rooms]);

  // Xử lý khi click vào phòng
  const handleRoomClick = (roomId: number) => {
    router.push(`/room/${roomId}`);
  };

  // Tính toán phòng hiển thị trên trang hiện tại
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Lấy danh sách loại phòng duy nhất
  const uniqueRoomTypes = Array.from(new Set(rooms.map(room => room.loaiPhongText)));

  return (
    <Layout>
      <div className={styles.roomsContainer}>
        <div className={styles.roomsHeader}>
          <h1>Danh sách phòng</h1>
          <p>Khám phá các loại phòng tại khách sạn của chúng tôi</p>
        </div>

        <div className={styles.filterSection}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Search
                placeholder="Tìm kiếm phòng..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={(value) => setSearchTerm(value)}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>

            <Col xs={24} sm={12} md={5} lg={5} xl={5}>
              <Select
                placeholder={<><UserOutlined /> Số khách</>}
                style={{ width: '100%' }}
                onChange={(value) => setGuestCount(value)}
                allowClear
                size="large"
              >
                <Option value={1}>1 khách</Option>
                <Option value={2}>2 khách</Option>
                <Option value={3}>3 khách</Option>
                <Option value={4}>4+ khách</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} md={5} lg={5} xl={5}>
              <Select
                placeholder={<><HomeOutlined /> Loại phòng</>}
                style={{ width: '100%' }}
                onChange={(value) => setRoomType(value)}
                allowClear
                size="large"
              >
                {uniqueRoomTypes.map((type) => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              <div className={styles.priceFilter}>
                <DollarOutlined /> Giá: {priceRange[0].toLocaleString('vi-VN')}đ - {priceRange[1].toLocaleString('vi-VN')}đ
                <Slider
                  range
                  min={0}
                  max={2000000}
                  step={100000}
                  defaultValue={[0, 2000000]}
                  onChange={(value) => setPriceRange(value as [number, number])}
                />
              </div>
            </Col>
          </Row>
        </div>

        <div className={styles.roomsResults}>
          <p>{filteredRooms.length} phòng được tìm thấy</p>
        </div>

        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <Button type="primary" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <Empty description="Không tìm thấy phòng nào phù hợp với tiêu chí tìm kiếm" />
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {paginatedRooms.map((room) => (
                <Col xs={24} sm={12} md={8} key={room.id}>
                  <Card
                    hoverable
                    className={styles.roomCard}
                    cover={
                      <div className={styles.roomImageContainer}>
                        <img
                          alt={room.tenPhong}
                          src={room.hinhAnh}
                          className={styles.roomImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop';
                          }}
                        />
                        <Tag color={room.trangThai === 1 ? 'green' : 'orange'} className={styles.roomStatus}>
                          {room.trangThaiText}
                        </Tag>
                      </div>
                    }
                    onClick={() => handleRoomClick(room.maPhong)}
                  >
                    <div className={styles.roomCardContent}>
                      <h3>{room.tenPhong}</h3>
                      <div className={styles.roomType}>{room.loaiPhongText}</div>
                      <div className={styles.roomFeatures}>
                        <span><UserOutlined /> {room.soNguoi} khách</span>
                        {room.features?.slice(0, 2).map((feature, index) => (
                          <span key={index}>{feature}</span>
                        ))}
                      </div>
                      <div className={styles.roomPrice}>
                        <span>{room.giaTien?.toLocaleString('vi-VN')}đ</span>
                        <small>/ đêm</small>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className={styles.pagination}>
              <Pagination
                current={currentPage}
                total={filteredRooms.length}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default RoomsPage;
