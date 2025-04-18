import { DichVu } from './serviceApi';

// Mock data cho dịch vụ
let mockServices: DichVu[] = [
  {
    maDichVu: 1,
    ten: 'Dịch vụ giặt ủi',
    gia: 150000,
    moTa: 'Giặt ủi quần áo trong ngày, bao gồm giặt, ủi và gấp cẩn thận. Giao tận phòng trong vòng 24 giờ.',
    hinhAnh: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 2,
    ten: 'Spa và massage',
    gia: 500000,
    moTa: 'Dịch vụ spa và massage cao cấp, giúp thư giãn toàn thân, giảm căng thẳng và mệt mỏi. Đội ngũ nhân viên chuyên nghiệp.',
    hinhAnh: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 3,
    ten: 'Đưa đón sân bay',
    gia: 350000,
    moTa: 'Dịch vụ đưa đón sân bay bằng xe sang trọng, có tài xế riêng. Đặt trước ít nhất 24 giờ.',
    hinhAnh: 'https://images.unsplash.com/photo-1556122071-e404eaedb77f?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 4,
    ten: 'Bữa sáng tự chọn',
    gia: 200000,
    moTa: 'Bữa sáng tự chọn với các món ăn Á-Âu đa dạng. Phục vụ từ 6:00 - 10:00 sáng tại nhà hàng hoặc giao tận phòng.',
    hinhAnh: 'https://images.unsplash.com/photo-1533089860892-a9c9db5cb96b?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 5,
    ten: 'Trông trẻ',
    gia: 250000,
    moTa: 'Dịch vụ trông trẻ chuyên nghiệp với nhân viên được đào tạo, giúp phụ huynh có thời gian tham gia các hoạt động khác.',
    hinhAnh: 'https://images.unsplash.com/photo-1560877241-7b8b01c41e3b?w=500&auto=format',
    trangThai: 0
  },
  {
    maDichVu: 6,
    ten: 'Thuê xe đạp',
    gia: 120000,
    moTa: 'Dịch vụ cho thuê xe đạp tham quan khu vực xung quanh. Giá thuê tính theo ngày.',
    hinhAnh: 'https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 7,
    ten: 'Phòng họp',
    gia: 1000000,
    moTa: 'Cho thuê phòng họp với đầy đủ trang thiết bị hiện đại, phù hợp cho các cuộc họp doanh nghiệp, hội nghị nhỏ.',
    hinhAnh: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 8,
    ten: 'Dịch vụ xe đưa đón',
    gia: 180000,
    moTa: 'Xe đưa đón đến các điểm du lịch trong thành phố theo lịch cố định. Vui lòng đặt trước ít nhất 2 giờ.',
    hinhAnh: 'https://images.unsplash.com/photo-1570125272675-923e3b9fee4c?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 9,
    ten: 'Bữa tối lãng mạn',
    gia: 800000,
    moTa: 'Bữa tối lãng mạn dành cho 2 người với nến, hoa và rượu vang. Phục vụ tại nhà hàng hoặc ban công phòng.',
    hinhAnh: 'https://images.unsplash.com/photo-1529516548843-b26b0b5e584e?w=500&auto=format',
    trangThai: 1
  },
  {
    maDichVu: 10,
    ten: 'Dịch vụ hướng dẫn viên',
    gia: 600000,
    moTa: 'Dịch vụ hướng dẫn viên du lịch chuyên nghiệp, thông thạo nhiều ngôn ngữ. Giá tính theo ngày.',
    hinhAnh: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=500&auto=format',
    trangThai: 0
  }
];

// Đảm bảo delay để giả lập API call thực tế
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API services ảo cho dịch vụ
export const mockServiceApi = {
  // Lấy tất cả dịch vụ
  getAllServices: async (): Promise<DichVu[]> => {
    await delay(800); // Giả lập độ trễ mạng
    return [...mockServices];
  },

  // Lấy dịch vụ theo ID
  getServiceById: async (id: number): Promise<DichVu> => {
    await delay(500);
    const service = mockServices.find(s => s.maDichVu === id);
    if (!service) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    return { ...service };
  },

  // Tạo dịch vụ mới
  createService: async (service: DichVu): Promise<any> => {
    await delay(1000);
    const newId = Math.max(...mockServices.map(s => s.maDichVu || 0)) + 1;
    const newService = {
      ...service,
      maDichVu: newId
    };
    mockServices.push(newService);
    return { message: 'Thêm dịch vụ thành công', success: true };
  },

  // Cập nhật dịch vụ
  updateService: async (id: number, service: DichVu): Promise<any> => {
    await delay(1000);
    const index = mockServices.findIndex(s => s.maDichVu === id);
    if (index === -1) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    mockServices[index] = {
      ...service,
      maDichVu: id
    };
    return { message: 'Cập nhật dịch vụ thành công', success: true };
  },

  // Xóa dịch vụ
  deleteService: async (id: number): Promise<any> => {
    await delay(800);
    const index = mockServices.findIndex(s => s.maDichVu === id);
    if (index === -1) {
      throw new Error('Không tìm thấy dịch vụ');
    }
    mockServices.splice(index, 1);
    return { message: 'Xóa dịch vụ thành công', success: true };
  }
};

export default mockServiceApi; 