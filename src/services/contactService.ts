import axios from 'axios';

// Sử dụng proxy thay vì direct API call
const BASE_URL = '/api';

export interface ContactForm {
  hoTen: string;
  email: string;
  soDienThoai?: string;
  tieuDe: string;
  noiDung: string;
}

export const contactService = {
  // Gửi form liên hệ
  submitContactForm: async (contactData: ContactForm): Promise<any> => {
    try {
      const response = await axios.post(`${BASE_URL}/LienHe/Create`, contactData);
      return {
        success: true,
        message: 'Gửi liên hệ thành công',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể gửi biểu mẫu liên hệ. Vui lòng thử lại sau.'
      };
    }
  },

  // Lấy tất cả form liên hệ (quản trị viên)
  getAllContactForms: async (): Promise<any> => {
    try {
      const response = await axios.get(`${BASE_URL}/LienHe/GetAll`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể lấy danh sách liên hệ. Vui lòng thử lại sau.'
      };
    }
  },

  // Trả lời form liên hệ
  replyToContact: async (id: number, reply: string): Promise<any> => {
    try {
      const response = await axios.put(`${BASE_URL}/LienHe/Reply`, {
        maLH: id,
        phanHoi: reply
      });
      return {
        success: true,
        message: 'Trả lời liên hệ thành công',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể trả lời liên hệ. Vui lòng thử lại sau.'
      };
    }
  }
};

export default contactService; 