import axios from 'axios';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export const sendContactForm = async (data: ContactFormData) => {
  try {
    const response = await axios.post('/api/contact', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 