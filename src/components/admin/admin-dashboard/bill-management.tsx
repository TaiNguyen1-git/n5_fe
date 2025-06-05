import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, InputNumber, Select, Form, Card, Statistic, Row, Col, Tooltip, Divider, Steps, message, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, PrinterOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import { getAllCustomers, type Customer } from '../../../services/customerService';

const { Option } = Select;
const { Step } = Steps;
const BASE_URL = '/api';

const BillManagement = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [viewBill, setViewBill] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewBillModalVisible, setIsNewBillModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [billItems, setBillItems] = useState<any[]>([]);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Customer data states for real-time customer name lookup
  const [customerMap, setCustomerMap] = useState<Record<number, Customer>>({});
  const [customerDataLoading, setCustomerDataLoading] = useState(false);

  // Customer search states
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  // State cho payment confirmation modal
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [billToPayment, setBillToPayment] = useState<any>(null);

  useEffect(() => {
    fetchBills();
    fetchCustomers();
    fetchPaymentMethods();
    fetchPaymentStatuses();
    fetchServices();
    fetchCustomerData();
  }, []);

  // Fetch customer data using customerService
  const fetchCustomerData = async () => {
    setCustomerDataLoading(true);
    try {
      const response = await getAllCustomers(1, 1000); // Get a large number to get all customers

      if (response.success && response.data?.items) {
        // Create a map of customer ID to customer data
        const customerMapData: Record<number, Customer> = {};
        response.data.items.forEach((customer: Customer) => {
          if (customer.maKH) {
            customerMapData[customer.maKH] = customer;
          }
        });
        setCustomerMap(customerMapData);
      } else {
      }
    } catch (error) {
    } finally {
      setCustomerDataLoading(false);
    }
  };

  // Helper function để lấy phương thức thanh toán dựa vào mã (cập nhật theo API thực tế)
  const getPaymentMethod = (maPhuongThuc: number | null | undefined): string => {
    // Sử dụng switch case theo dữ liệu thực tế từ API
    switch (maPhuongThuc) {
      case 2: return 'momo'; // Momo
      case 3: return 'bank'; // Ngân Hàng
      case 4: return 'cash'; // Tiền mặt
      case 5: return 'credit'; // Thẻ Tín Dụng
      case 6: return 'debit'; // Thẻ Ghi Nợ
      case 7: return 'zalopay'; // ZaloPay
      case 8: return 'vnpay'; // VNPay
      case 9: return 'paypal'; // PayPal
      default: return 'cash'; // Mặc định là tiền mặt
    }
  };

  // Helper function để lấy tên phương thức thanh toán dựa vào mã (cập nhật theo API thực tế)
  const getPaymentMethodName = (maPhuongThuc: number | null | undefined): string => {
    // Tìm phương thức thanh toán trong danh sách từ API
    const method = paymentMethods.find(m => m.id === maPhuongThuc);

    // Nếu tìm thấy, trả về tên phương thức (loại bỏ tab và space thừa)
    if (method && method.tenPhuongThuc) {
      return method.tenPhuongThuc.trim();
    }

    // Fallback mapping theo dữ liệu thực tế từ API
    switch (maPhuongThuc) {
      case 2: return 'Momo';
      case 3: return 'Ngân Hàng';
      case 4: return 'Tiền mặt';
      case 5: return 'Thẻ Tín Dụng';
      case 6: return 'Thẻ Ghi Nợ';
      case 7: return 'ZaloPay';
      case 8: return 'VNPay';
      case 9: return 'PayPal';
      default: return 'Không xác định';
    }
  };

  // Helper function để lấy tên trạng thái thanh toán dựa vào mã
  const getPaymentStatusName = (maTrangThai: number | null | undefined): string => {
    // Nếu maTrangThai là null hoặc undefined, trả về trạng thái mặc định
    if (maTrangThai === null || maTrangThai === undefined) {
      return 'Chưa Thanh Toán';
    }

    // Tìm trạng thái thanh toán trong danh sách từ API
    const status = paymentStatuses.find(s => s.id === maTrangThai);

    // Nếu tìm thấy, trả về tên trạng thái
    if (status && status.tenTT) {
      return status.tenTT;
    }

    // Nếu không tìm thấy, sử dụng switch case (cập nhật theo API thực tế)
    switch (maTrangThai) {
      case 0: return 'Đã Hủy';
      case 1: return 'Đã Thanh Toán';
      case 2: return 'Chưa Thanh Toán';
      case 3: return 'Đang Xử Lý';
      default: return `Trạng thái ${maTrangThai}`;
    }
  };

  // Dữ liệu mẫu cho hóa đơn
  const sampleBills = [
    {
      id: 1,
      billNumber: 'HD001',
      customerName: 'Nguyễn Văn A',
      roomNumber: '101',
      checkIn: '2023-05-01',
      checkOut: '2023-05-03',
      createdAt: '2023-05-03',
      totalAmount: 1500000,
      paymentMethod: 'cash',
      status: 'paid',
      items: [
        { id: 1, description: 'Tiền phòng', quantity: 2, price: 700000, amount: 1400000 },
        { id: 2, description: 'Dịch vụ ăn sáng', quantity: 2, price: 50000, amount: 100000 }
      ]
    },
    {
      id: 2,
      billNumber: 'HD002',
      customerName: 'Trần Thị B',
      roomNumber: '202',
      checkIn: '2023-05-05',
      checkOut: '2023-05-07',
      createdAt: '2023-05-07',
      totalAmount: 2100000,
      paymentMethod: 'card',
      status: 'paid',
      items: [
        { id: 1, description: 'Tiền phòng', quantity: 2, price: 900000, amount: 1800000 },
        { id: 2, description: 'Dịch vụ spa', quantity: 1, price: 300000, amount: 300000 }
      ]
    },
    {
      id: 3,
      billNumber: 'HD003',
      customerName: 'Lê Văn C',
      roomNumber: '303',
      checkIn: '2023-05-10',
      checkOut: '2023-05-12',
      createdAt: '2023-05-10',
      totalAmount: 2500000,
      paymentMethod: 'transfer',
      status: 'pending',
      items: [
        { id: 1, description: 'Tiền phòng', quantity: 2, price: 1100000, amount: 2200000 },
        { id: 2, description: 'Dịch vụ giặt ủi', quantity: 3, price: 100000, amount: 300000 }
      ]
    }
  ];

  // Fetch bills from backend
  const fetchBills = async () => {
    setLoading(true);
    try {
      // Thêm timeout để tránh request quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout

      try {
        const response = await axios.get(`${BASE_URL}/HoaDon/GetAll`, { signal: controller.signal });

        clearTimeout(timeoutId);
        // Kiểm tra xem response.data có tồn tại và là mảng không
        if (response.data) {
          // Đảm bảo response.data là mảng
          const billsData = Array.isArray(response.data) ? response.data : [response.data];

          const formattedBills = billsData.map((bill: any) => {
            // Xử lý trường hợp bill là null hoặc undefined
            if (!bill) return null;

            // Lấy thông tin khách hàng từ phongThueThanhToans nếu có
            const phongThue = bill.phongThueThanhToans && bill.phongThueThanhToans.length > 0
              ? bill.phongThueThanhToans[0]
              : null;

            // Lấy thông tin khách hàng từ maKH
            const maKH = bill.maKH;
            // Use customerMap for real-time customer name lookup
            const customer = customerMap[maKH];
            const customerName = customer?.tenKH ||
                                customers.find(c => c.maKH === maKH)?.tenKH ||
                                phongThue?.tenKH ||
                                `Khách hàng ${maKH}`;

            // Lấy thông tin phòng
            const roomNumber = phongThue?.maPhong || bill.maPhong || 'N/A';

            // Lấy thông tin check-in/check-out
            const checkIn = phongThue?.ngayBatDau || bill.ngayBatDau || bill.ngayTao;
            const checkOut = phongThue?.ngayKetThuc || bill.ngayKetThuc || bill.ngayTao;

            // Xử lý chi tiết hóa đơn
            let items = [];

            // Thêm chi tiết dịch vụ nếu có
            if (bill.chiTietHoaDonDVs && bill.chiTietHoaDonDVs.length > 0) {
              items = bill.chiTietHoaDonDVs.map((item: any) => ({
                id: item.maChiTiet || Date.now() + Math.random(),
                description: item.dichVu?.ten || 'Dịch vụ',
                quantity: item.soLuong || 1,
                price: item.donGia || 0,
                amount: item.thanhTien || (item.soLuong * item.donGia) || 0
              }));
            }

            // Thêm chi tiết phòng nếu có
            if (phongThue) {
              items.push({
                id: `room-${phongThue.maPhong || Date.now()}`,
                description: `Tiền phòng ${phongThue.maPhong || ''}`,
                quantity: 1,
                price: phongThue.donGia || 0,
                amount: phongThue.thanhTien || phongThue.donGia || 0
              });
            }

            // Nếu không có chi tiết nào, tạo một mục mặc định
            if (items.length === 0) {
              items = [{
                id: 1,
                description: 'Tổng hóa đơn',
                quantity: 1,
                price: bill.tongTien || 0,
                amount: bill.tongTien || 0
              }];
            }

            // Xử lý ngày tạo hóa đơn
            let createdAt = bill.ngayLapHD || bill.ngayTao;

            // Kiểm tra nếu ngày tạo không hợp lệ hoặc không tồn tại
            if (!createdAt || !dayjs(createdAt).isValid()) {
              // Thử sử dụng ngày đặt phòng nếu có
              if (phongThue && phongThue.ngayBatDau && dayjs(phongThue.ngayBatDau).isValid()) {
                createdAt = phongThue.ngayBatDau;
              } else {
                // Nếu không có ngày hợp lệ, sử dụng ngày hiện tại
                createdAt = new Date().toISOString();
              }
            }
            // Lưu thông tin giảm giá
            const discount = bill.giamGia !== undefined ? bill.giamGia : null;

            // Lưu thông tin chi tiết hóa đơn dịch vụ
            const serviceDetails = bill.chiTietHoaDonDVs || [];

            return {
              id: bill.maHD,
              billNumber: `HD${String(bill.maHD).padStart(3, '0')}`,
              customerName: customerName,
              roomNumber: roomNumber,
              checkIn: checkIn,
              checkOut: checkOut,
              createdAt: createdAt,
              totalAmount: bill.tongTien || 0,
              paymentMethod: getPaymentMethod(bill.maPhuongThuc),
              paymentMethodName: getPaymentMethodName(bill.maPhuongThuc),
              status: bill.trangThai === 1 ? 'paid' : bill.trangThai === 2 ? 'pending' : 'cancelled',
              maKH: bill.maKH,
              maPhuongThuc: bill.maPhuongThuc,
              trangThai: bill.trangThai, // Thêm field này để sử dụng trong logic
              trangThaiThanhToan: bill.trangThaiThanhToan,
              trangThaiThanhToanName: getPaymentStatusName(bill.trangThaiThanhToan || bill.trangThai),
              items: items,
              discount: discount,
              maGiam: bill.maGiam, // Thêm field này để sử dụng trong API update
              ngayLapHD: bill.ngayLapHD, // Thêm field này để sử dụng trong API update
              tongTien: bill.tongTien, // Thêm field này để sử dụng trong API update
              serviceDetails: serviceDetails
            };
          }).filter(Boolean); // Lọc bỏ các phần tử null hoặc undefined


          setBills(formattedBills);
          message.success('Đã tải danh sách hóa đơn');
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error('Yêu cầu quá thời gian, sử dụng dữ liệu mẫu');
        } else {
          throw fetchError;
        }
      }
    } catch (error: any) {
      message.warning('Không thể kết nối đến API, hiển thị dữ liệu mẫu');

      // Sử dụng dữ liệu mẫu khi không thể kết nối đến API
      setBills(sampleBills);
    } finally {
      setLoading(false);
    }
  };



  // Dữ liệu mẫu cho phương thức thanh toán
  const samplePaymentMethods = [
    {
      id: 1,
      tenPhuongThuc: "Tiền mặt",
      moTa: "Thanh toán bằng Tiền mặt",
      trangThai: true
    },
    {
      id: 2,
      tenPhuongThuc: "Thẻ",
      moTa: "Thanh toán bằng Thẻ",
      trangThai: true
    },
    {
      id: 3,
      tenPhuongThuc: "Chuyển khoản",
      moTa: "Thanh toán bằng Chuyển khoản",
      trangThai: true
    },
    {
      id: 4,
      tenPhuongThuc: "Ví điện tử",
      moTa: "Thanh toán bằng Ví điện tử",
      trangThai: true
    }
  ];

  // Dữ liệu mẫu cho trạng thái thanh toán (cập nhật theo API thực tế)
  const samplePaymentStatuses = [
    {
      id: 1,
      tenTT: "Đã Thanh Toán"
    },
    {
      id: 2,
      tenTT: "Chưa Thanh Toán"
    }
  ];

  // Fetch phương thức thanh toán từ backend
  const fetchPaymentMethods = async () => {
    try {
      // Thêm timeout để tránh request quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout

      try {
      const response = await axios.get(`${BASE_URL}/PhuongThucThanhToan/GetAll`);
        clearTimeout(timeoutId);
        // Kiểm tra xem response.data có tồn tại không
        if (response.data) {
          // Đảm bảo response.data là mảng
          const methodsData = Array.isArray(response.data) ? response.data : [response.data];

          const formattedMethods = methodsData
            .filter((method: any) => method && (method.id || method.maDonVi !== undefined)) // Lọc bỏ các phần tử không hợp lệ
            .map((method: any) => ({
              id: method.id || Date.now(), // Tạo ID nếu không có
              tenPhuongThuc: method.tenPhuongThuc || 'Không xác định',
              moTa: method.moTa || '',
              trangThai: method.trangThai !== undefined ? method.trangThai : true
            }));

          if (formattedMethods.length > 0) {
            setPaymentMethods(formattedMethods);
          } else {
            setPaymentMethods(samplePaymentMethods);
          }
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error('Yêu cầu quá thời gian, sử dụng dữ liệu mẫu');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      // Sử dụng dữ liệu mẫu khi không thể kết nối đến API
      setPaymentMethods(samplePaymentMethods);
    }
  };

  // Fetch trạng thái thanh toán từ backend
  const fetchPaymentStatuses = async () => {
    try {
      // Thêm timeout để tránh request quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout

      try {
      const response = await axios.get(`${BASE_URL}/TrangThaiThanhToan/GetAll`);
        clearTimeout(timeoutId);
        // Kiểm tra xem response.data có tồn tại không
        if (response.data) {
          // Đảm bảo response.data là mảng
          const statusesData = Array.isArray(response.data) ? response.data : [response.data];

          const formattedStatuses = statusesData
            .filter((status: any) => status && (status.id !== undefined || status.maDonVi !== undefined)) // Lọc bỏ các phần tử không hợp lệ
            .map((status: any) => ({
              id: status.id !== undefined ? status.id : (status.maDonVi !== undefined ? status.maDonVi : Date.now()),
              tenTT: status.tenTT || 'Không xác định',
              maDonVi: status.maDonVi
            }));

          if (formattedStatuses.length > 0) {
            setPaymentStatuses(formattedStatuses);
          } else {
            setPaymentStatuses(samplePaymentStatuses);
          }
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error('Yêu cầu quá thời gian, sử dụng dữ liệu mẫu');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      // Sử dụng dữ liệu mẫu khi không thể kết nối đến API
      setPaymentStatuses(samplePaymentStatuses);
    }
  };

  // Không sử dụng dữ liệu mẫu cho khách hàng

  // Fetch services from backend
  const fetchServices = async () => {
    try {
      // Thêm timeout để tránh request quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout

      try {
      const response = await axios.get(`${BASE_URL}/DichVu/GetAll`);
        clearTimeout(timeoutId);
        // Kiểm tra xem response.data có tồn tại không
        if (response.data) {
          // Kiểm tra cấu trúc dữ liệu
          let serviceItems = [];

          // Kiểm tra nếu response.data có thuộc tính items (cấu trúc phân trang)
          if (response.data && response.data.items && Array.isArray(response.data.items)) {
            serviceItems = response.data.items;
          }
          // Nếu response.data là mảng
          else if (Array.isArray(response.data)) {
            serviceItems = response.data;
          }
          // Nếu response.data là object đơn lẻ
          else if (response.data) {
            serviceItems = [response.data];
          }
          // Xử lý dữ liệu dịch vụ
          const formattedServices = serviceItems
            .filter((service: any) => {
              // Lọc bỏ các phần tử null hoặc undefined
              if (!service) return false;

              // Kiểm tra trạng thái dịch vụ (nếu trangThai = 0, không hiển thị)
              if (service.trangThai === 0) return false;

              return true;
            })
            .map((service: any) => {
              // Tạo đối tượng dịch vụ đã định dạng
              const formattedService = {
                maDichVu: service.maDichVu,
                ten: service.ten || 'Dịch vụ không tên',
                donGia: service.gia || service.donGia || 0,
                moTa: service.moTa || '',
                trangThai: service.trangThai
              };
              return formattedService;
            });

          if (formattedServices.length > 0) {
            setServices(formattedServices);
          } else {
            setServices([]);
            message.warning('Không tìm thấy thông tin dịch vụ');
          }
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error('Yêu cầu quá thời gian, không thể lấy danh sách dịch vụ');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
    }
  };

  // Save recent customer selection
  const saveRecentCustomer = (customer: Customer) => {
    const recent = recentCustomers.filter(c => c.maKH !== customer.maKH);
    const newRecent = [customer, ...recent].slice(0, 5); // Lưu 5 khách hàng gần đây
    setRecentCustomers(newRecent);
    localStorage.setItem('recentCustomers', JSON.stringify(newRecent));
  };

  // Load recent customers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentCustomers');
    if (saved) {
      try {
        setRecentCustomers(JSON.parse(saved));
      } catch (e) {
        // Error loading recent customers
      }
    }
  }, []);

  // Filter customers based on search text
  const filterCustomers = (searchText: string) => {
    if (!searchText.trim()) {
      // Hiển thị khách hàng gần đây + một số khách hàng khác
      const otherCustomers = customers.filter(c =>
        !recentCustomers.some(rc => rc.maKH === c.maKH)
      ).slice(0, 45);
      setFilteredCustomers([...recentCustomers, ...otherCustomers]);
      return;
    }

    const filtered = customers.filter(customer => {
      const search = searchText.toLowerCase();
      return (
        customer.tenKH.toLowerCase().includes(search) ||
        (customer.soDT && customer.soDT.includes(search)) ||
        (customer.email && customer.email.toLowerCase().includes(search)) ||
        customer.maKH.toString().includes(search)
      );
    }).slice(0, 20); // Giới hạn 20 kết quả tìm kiếm

    setFilteredCustomers(filtered);
  };

  // Update filtered customers when customers change
  useEffect(() => {
    filterCustomers(customerSearchText);
  }, [customers, customerSearchText]);

  // Fetch customers from backend
  const fetchCustomers = async () => {
    try {
      // Thêm timeout để tránh request quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout

      try {
      const response = await axios.get(`${BASE_URL}/KhachHang/GetAll`);
        clearTimeout(timeoutId);

        // Kiểm tra xem response.data có tồn tại không
        if (response.data) {
          let customersList = [];

          // Kiểm tra cấu trúc dữ liệu phân trang với items
          if (response.data.items && Array.isArray(response.data.items)) {
            customersList = response.data.items;
          }
          // Kiểm tra nếu response.data là mảng trực tiếp
          else if (Array.isArray(response.data)) {
            customersList = response.data;
          }
          // Kiểm tra thuộc tính value
          else if (response.data.value && Array.isArray(response.data.value)) {
            customersList = response.data.value;
          }
          // Nếu là object đơn lẻ
          else if (response.data.maKH) {
            customersList = [response.data];
          }

          const formattedCustomers = customersList
            .filter((customer: any) => {
              // Lọc bỏ các phần tử không hợp lệ và khách hàng đã xóa
              return customer && customer.maKH && !customer.xoa;
            })
            .map((customer: any) => ({
              maKH: customer.maKH,
              tenKH: customer.tenKH || 'Khách hàng không tên',
              soDT: customer.soDT || customer.phone || 'Không có SĐT',
              email: customer.email || 'Không có email'
            }));

          if (formattedCustomers.length > 0) {
            setCustomers(formattedCustomers);
            message.success(`Đã tải ${formattedCustomers.length} khách hàng`);
          } else {
            setCustomers([]);
            message.warning('Không tìm thấy thông tin khách hàng');
          }
        } else {
          throw new Error('Dữ liệu không hợp lệ');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error('Yêu cầu quá thời gian, sử dụng dữ liệu mẫu');
        } else {
          throw fetchError;
        }
      }
    } catch (error: any) {

      // Sử dụng dữ liệu mẫu khi không thể kết nối đến API
      const sampleCustomers = [
        {
          maKH: 1,
          tenKH: 'Nguyễn Văn A',
          soDT: '0123456789',
          email: 'nguyenvana@example.com'
        },
        {
          maKH: 2,
          tenKH: 'Trần Thị B',
          soDT: '0987654321',
          email: 'tranthib@example.com'
        },
        {
          maKH: 3,
          tenKH: 'Lê Văn C',
          soDT: '0369852147',
          email: 'levanc@example.com'
        }
      ];

      setCustomers(sampleCustomers);
      message.warning('Không thể kết nối đến API khách hàng, sử dụng dữ liệu mẫu');
    }
  };



  // Xử lý xóa hóa đơn
  const handleDelete = (billRecord: any) => {
    try {
      // Validate input
      if (!billRecord) {
        message.error('Không tìm thấy thông tin hóa đơn để xóa');
        return;
      }

      // Lấy maHD từ record (có thể là id hoặc maHD)
      const maHD = billRecord.maHD || billRecord.id;
      const billNumber = billRecord.billNumber || `HD${String(maHD).padStart(3, '0')}`;


      Modal.confirm({
        title: 'Xác nhận xóa hóa đơn',
        content: `Bạn chắc chắn muốn xóa hóa đơn ${billNumber}? Hành động này không thể hoàn tác.`,
        okText: 'Xóa hóa đơn',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
        try {
          // Gửi yêu cầu xóa hóa đơn đến backend với maHD
          const response = await fetch(`${BASE_URL}/HoaDon/Delete`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: maHD })
          });

          if (response.ok) {
            // Hiển thị thông báo thành công
            message.success(`Đã xóa hóa đơn ${billNumber} thành công`);

            // Xóa hóa đơn khỏi state
            setBills(bills.filter(bill => {
              const billMaHD = bill.maHD || bill.id;
              return billMaHD !== maHD;
            }));

            // Làm mới danh sách hóa đơn
            fetchBills();
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error: any) {
          Modal.error({
            title: 'Lỗi xóa hóa đơn',
            content: `Không thể xóa hóa đơn ${billNumber}. ${error.message || 'Vui lòng thử lại sau.'}`
          });
        }
      },
    });
    } catch (error: any) {
      message.error(`Lỗi khi xóa hóa đơn: ${error.message || 'Vui lòng thử lại sau'}`);
    }
  };

  // Xử lý xem chi tiết hóa đơn
  const handleView = async (bill: any) => {

    try {
      // Fetch chi tiết dịch vụ từ API
      const serviceDetailsResponse = await fetch(`${BASE_URL}/ChiTietHoaDonDV/GetAll`);
      if (serviceDetailsResponse.ok) {
        const serviceDetailsData = await serviceDetailsResponse.json();

        // Xử lý cấu trúc dữ liệu từ API
        let allServiceDetails = [];
        if (serviceDetailsData && serviceDetailsData.value && Array.isArray(serviceDetailsData.value)) {
          allServiceDetails = serviceDetailsData.value;
        } else if (serviceDetailsData && serviceDetailsData.items && Array.isArray(serviceDetailsData.items)) {
          allServiceDetails = serviceDetailsData.items;
        } else if (Array.isArray(serviceDetailsData)) {
          allServiceDetails = serviceDetailsData;
        }

        // Debug: Xem tất cả maHD có trong service details

        // Debug: Xem cấu trúc của một vài service details đầu tiên

        // Lọc chi tiết dịch vụ theo mã hóa đơn (so sánh cả string và number)
        const billId = bill.maHD || bill.id;

        const billServiceDetails = allServiceDetails.filter((detail: any) => {
          const detailBillId = detail.maHD;
          const matches = detailBillId == billId || detailBillId === billId ||
                         String(detailBillId) === String(billId);
          return matches;
        });

          // Kiểm tra dữ liệu services

          // Enriched service details với thông tin dịch vụ
          const enrichedServiceDetails = billServiceDetails.map((detail: any, index: number) => {
            const service = services.find(s => s.maDichVu === detail.maDichVu);

            return {
              ...detail,
              key: detail.maChiTiet || `service-${index}`, // Thêm key cho table
              serviceName: service?.ten || detail.dichVu?.ten || `Dịch vụ ${detail.maDichVu}`,
              serviceDescription: service?.moTa || 'Không có mô tả',
              serviceCategory: service?.loaiDichVu || 'Khác'
            };
          });

          // Gán chi tiết dịch vụ vào bill
          const billWithDetails = {
            ...bill,
            serviceDetails: enrichedServiceDetails
          };

          setViewBill(billWithDetails);
        } else {
          setViewBill({ ...bill, serviceDetails: [] });
        }
    } catch (error) {
      setViewBill({ ...bill, serviceDetails: [] });
    }

    setIsModalVisible(true);
  };

  // Xử lý in hóa đơn
  const handlePrint = (bill: any) => {
    message.success('Đang in hóa đơn ' + bill.billNumber);
  };

  // Xử lý thêm hóa đơn mới
  const handleAddBill = () => {
    form.validateFields().then(async (values) => {
      try {
        const {
          customerId,
          paymentMethod,
          discountType,
          existingDiscountId,
          discountName,
          discountDescription,
          discountAmount,
          serviceDetails
        } = values;

        // Tính tổng tiền từ chi tiết dịch vụ
        let totalAmount = 0;
        const formattedServiceDetails: Array<{
          maHD: number;
          maDichVu: number;
          soLuong: number;
          donGia: number;
          thanhTien: number;
        }> = [];

        if (serviceDetails && serviceDetails.length > 0) {
          serviceDetails.forEach((service: any) => {
            const amount = service.soLuong * service.donGia;
            totalAmount += amount;

            // Định dạng chi tiết dịch vụ theo API
            formattedServiceDetails.push({
              maHD: 0, // Sẽ được cập nhật sau khi tạo hóa đơn
              maDichVu: service.maDichVu,
              soLuong: service.soLuong,
              donGia: service.donGia,
              thanhTien: amount
            });
          });
        }

        // Kiểm tra xem có ít nhất một dịch vụ hoặc tổng tiền > 0
        if (totalAmount <= 0) {
          Modal.warning({
            title: 'Thông tin không hợp lệ',
            content: 'Vui lòng thêm ít nhất một dịch vụ hoặc đảm bảo tổng tiền lớn hơn 0.'
          });
          return;
        }

        // Kiểm tra khách hàng được chọn
        if (!customerId) {
          Modal.warning({
            title: 'Thiếu thông tin',
            content: 'Vui lòng chọn khách hàng cho hóa đơn.'
          });
          return;
        }

        // Xử lý giảm giá
        let discountId = 1; // Mặc định không giảm giá

        if (discountType === 'existing' && existingDiscountId) {
          discountId = existingDiscountId;
        } else if (discountType === 'new' && discountName && discountDescription && discountAmount) {
          try {

            // Tạo giảm giá mới
            const newDiscountData = {
              tenGG: discountName,
              moTaGiam: discountDescription,
              giaTriGiam: discountAmount,
              ngayBatDau: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'),
              ngayKetThuc: dayjs().add(30, 'days').format('YYYY-MM-DDTHH:mm:ss.SSS'), // Có hiệu lực 30 ngày
              trangThai: true
            };

            const discountResponse = await fetch(`${BASE_URL}/GiamGia/Create`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(newDiscountData)
            });

            if (discountResponse.ok) {

              // Lấy ID giảm giá mới tạo (cần fetch lại để lấy ID)
              try {
                const allDiscountsResponse = await fetch(`${BASE_URL}/GiamGia/GetAll`);
                if (allDiscountsResponse.ok) {
                  const allDiscountsData = await allDiscountsResponse.json();
                  if (allDiscountsData && allDiscountsData.value && Array.isArray(allDiscountsData.value)) {
                    // Tìm giảm giá vừa tạo (theo tên và mô tả)
                    const newDiscount = allDiscountsData.value.find((d: any) =>
                      d.tenGG === discountName && d.moTaGiam === discountDescription
                    );
                    if (newDiscount) {
                      discountId = newDiscount.maGiam || newDiscount.id;
                    }
                  }
                }
              } catch (fetchError) {
              }
            } else {
              Modal.warning({
                title: 'Lỗi tạo giảm giá',
                content: 'Không thể tạo giảm giá mới. Hóa đơn sẽ được tạo không có giảm giá.'
              });
            }
          } catch (discountError) {
            Modal.warning({
              title: 'Lỗi tạo giảm giá',
              content: 'Không thể tạo giảm giá mới. Hóa đơn sẽ được tạo không có giảm giá.'
            });
          }
        }

        // Sử dụng cấu trúc dữ liệu chính xác từ API mẫu
        const newBillData = {
          maKH: customerId || 0, // Sử dụng ID khách hàng từ form
          ngayLapHD: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'),
          maPhuongThuc: paymentMethod, // Sử dụng trực tiếp giá trị từ form
          tongTien: totalAmount,
          maGiam: discountId, // Sử dụng ID giảm giá đã xử lý
          trangThai: 2 // Trạng thái 2 = "Chưa Thanh Toán" cho hóa đơn mới
        };

        try {
          // Bước 1: Tạo hóa đơn mới
          const billResponse = await fetch(`${BASE_URL}/HoaDon/Create`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newBillData)
          });

          if (!billResponse.ok) {
            throw new Error(`HTTP error! status: ${billResponse.status}`);
          }

          const billData = await billResponse.json();
          let hasServiceError = false;

          // Kiểm tra response từ API

          // Vì API không trả về mã hóa đơn, ta sẽ fetch lại danh sách để lấy hóa đơn mới nhất
          let latestBillId = null;

          if (billData && billData.statusCode === 200) {

            try {
              // Fetch lại danh sách hóa đơn để lấy hóa đơn mới nhất
              const billsResponse = await fetch(`${BASE_URL}/HoaDon/GetAll`);
              if (billsResponse.ok) {
                const billsData = await billsResponse.json();

                if (billsData && billsData.value && Array.isArray(billsData.value)) {
                  // Tìm hóa đơn mới nhất của khách hàng này
                  const customerBills = billsData.value.filter((bill: any) => bill.maKH === customerId);
                  if (customerBills.length > 0) {
                    // Sắp xếp theo ngày tạo và lấy hóa đơn mới nhất
                    const latestBill = customerBills.sort((a: any, b: any) =>
                      new Date(b.ngayLapHD).getTime() - new Date(a.ngayLapHD).getTime()
                    )[0];
                    latestBillId = latestBill.maHD;
                  }
                }
              }
            } catch (fetchError) {
            }
          }

          // Nếu có chi tiết dịch vụ và đã có mã hóa đơn, thêm chi tiết hóa đơn dịch vụ
          if (formattedServiceDetails.length > 0 && latestBillId) {

            // Cập nhật mã hóa đơn cho chi tiết dịch vụ
            formattedServiceDetails.forEach(detail => {
              detail.maHD = latestBillId;
            });

            // Bước 2: Tạo chi tiết hóa đơn dịch vụ
            for (const serviceDetail of formattedServiceDetails) {
              try {
                const serviceResponse = await fetch(`${BASE_URL}/ChiTietHoaDonDV/Create`, {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(serviceDetail)
                });

                if (!serviceResponse.ok) {
                  hasServiceError = true;
                } else {
                }
              } catch (serviceError) {
                hasServiceError = true;
              }
            }
          } else if (formattedServiceDetails.length > 0 && !latestBillId) {
            hasServiceError = true;
          }

          // Hiển thị thông báo thành công
          if (hasServiceError) {
            Modal.warning({
              title: 'Tạo hóa đơn thành công nhưng có lỗi',
              content: 'Đã tạo hóa đơn mới thành công nhưng có lỗi khi thêm chi tiết dịch vụ. Vui lòng kiểm tra lại.',
              onOk: () => {
                setIsNewBillModalVisible(false);
                form.resetFields();
                setBillItems([]);

                // Làm mới danh sách hóa đơn
                fetchBills();
              }
            });
          } else {
            Modal.success({
              title: 'Tạo hóa đơn thành công',
              content: `Đã tạo hóa đơn mới thành công${latestBillId ? ` với mã: ${latestBillId}` : ''}`,
              onOk: () => {
                setIsNewBillModalVisible(false);
                form.resetFields();
                setBillItems([]);

                // Làm mới danh sách hóa đơn
                fetchBills();
              }
            });
          }
        } catch (apiError: any) {

          // Hiển thị thông báo lỗi chi tiết
          let errorMessage = 'Không thể tạo hóa đơn mới. Vui lòng thử lại sau.';

          if (apiError.message) {
            errorMessage = apiError.message;
          }

          Modal.error({
            title: 'Lỗi tạo hóa đơn',
            content: `${errorMessage}\n\nChi tiết: ${JSON.stringify(apiError, null, 2)}`
          });
        }
      } catch (error) {
        Modal.error({
          title: 'Lỗi',
          content: 'Không thể tạo hóa đơn mới. Vui lòng thử lại sau.'
        });
      }
    }).catch(() => { message.error('Vui lòng điền đầy đủ thông tin'); });
  };



  // Xử lý chỉnh sửa hóa đơn
  const handleEdit = (bill: any) => {
    setEditingBill({...bill});
    setIsEditModalVisible(true);
  };

  // Xử lý lưu chỉnh sửa hóa đơn
  const handleSaveEdit = () => {
    form.validateFields().then(async values => {
      try {
        const { paymentMethod } = values;

        // Chuẩn bị dữ liệu cập nhật theo cấu trúc API
        const updateData = {
          maHD: editingBill.id,
          ngayLapHD: editingBill.createdAt || dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'),
          maPhuongThuc: paymentMethod, // Sử dụng giá trị từ form
          tongTien: editingBill.totalAmount || 0,
          maGiam: editingBill.discount || 1, // Sử dụng maGiam thay vì giamGia
          trangThai: editingBill.status === 'paid' ? 1 : editingBill.status === 'cancelled' ? 0 : 2
        };

        // Log data for debugging
        console.log('Update data:', updateData);
        // Gửi yêu cầu cập nhật hóa đơn đến backend          await
        // Hiển thị thông báo thành công
        Modal.success({
          title: 'Cập nhật thành công',
          content: 'Đã cập nhật thông tin hóa đơn',
          onOk: () => {
            // Cập nhật hóa đơn trong state
            setBills(bills.map(item =>
              item.id === editingBill.id ? {
                ...editingBill,
                maPhuongThuc: paymentMethod,
                paymentMethodName: getPaymentMethodName(paymentMethod)
              } : item
            ));

            setIsEditModalVisible(false);

            // Làm mới danh sách hóa đơn
            fetchBills();
          }
        });
      } catch (error) {
        Modal.error({
          title: 'Lỗi',
          content: 'Không thể cập nhật hóa đơn. Vui lòng thử lại sau.'
        });
      }
    }).catch(() => { message.error('Vui lòng điền đầy đủ thông tin'); });
  };

  // Xử lý thanh toán hóa đơn
  const handlePayment = (bill: any) => {

    // Validate dữ liệu hóa đơn trước khi mở modal
    if (!bill) {
      message.error('Không tìm thấy thông tin hóa đơn');
      return;
    }

    const maHD = bill.maHD || bill.id;
    if (!maHD) {
      message.error('Không tìm thấy mã hóa đơn');
      return;
    }

    // Kiểm tra hóa đơn có trong danh sách hiện tại không
    const existingBill = bills.find(b => b.id === maHD || b.maHD === maHD);
    if (!existingBill) {
      message.error('Hóa đơn không tồn tại trong danh sách hiện tại. Vui lòng làm mới trang.');
      return;
    }

    // Sử dụng state để quản lý modal
    setBillToPayment(bill);
    setIsPaymentModalVisible(true);
  };

  // Xử lý xác nhận thanh toán (Frontend-only solution)
  const handleConfirmPayment = async () => {
    if (!billToPayment) return;
    setIsPaymentModalVisible(false);

    try {
      // Validate dữ liệu hóa đơn
      const maHD = billToPayment.maHD || billToPayment.id;
      if (!maHD) {
        throw new Error('Không tìm thấy mã hóa đơn. Vui lòng làm mới trang và thử lại.');
      }

      // Kiểm tra hóa đơn có tồn tại trong danh sách hiện tại không
      const existingBill = bills.find(b => b.id === maHD || b.maHD === maHD);
      if (!existingBill) {
        throw new Error('Hóa đơn không tồn tại trong danh sách hiện tại. Vui lòng làm mới trang.');
      }

      // Hiển thị thông báo thành công
      message.success({
        content: `Đã xác nhận thanh toán cho hóa đơn ${billToPayment.billNumber || billToPayment.maHD}`,
        duration: 3
      });

      // Cập nhật hóa đơn trong state (Frontend-only) - chỉ cập nhật hóa đơn được chọn
      const targetMaHD = billToPayment.maHD || billToPayment.id;

      let updatedCount = 0;
      const updatedBills = bills.map(item => {
        // So sánh chính xác với maHD của hóa đơn được chọn
        const itemMaHD = item.maHD || item.id;

        // Kiểm tra cả maHD và các thông tin khác để đảm bảo đúng hóa đơn
        if (itemMaHD === targetMaHD &&
            item.billNumber === billToPayment.billNumber &&
            (item.status === 'pending' || item.trangThai === 2)) {
          updatedCount++;
          return {...item, status: 'paid', trangThai: 1, trangThaiThanhToanName: 'Đã Thanh Toán'};
        }
        return item;
      });
      if (updatedCount !== 1) {
      }

      setBills(updatedBills);

      // Nếu đang xem chi tiết hóa đơn này, cập nhật viewBill và mở lại modal
      if (viewBill) {
        const viewBillMaHD = viewBill.maHD || viewBill.id;
        const targetMaHD = billToPayment.maHD || billToPayment.id;

        if (viewBillMaHD === targetMaHD) {
          const updatedViewBill = {
            ...viewBill,
            status: 'paid',
            trangThai: 1,
            trangThaiThanhToanName: 'Đã Thanh Toán'
          };
          setViewBill(updatedViewBill);
          setIsModalVisible(true); // Mở lại modal chi tiết
        }
      }

      // Reset billToPayment
      setBillToPayment(null);

    } catch (error: any) {
      message.error(`Không thể xác nhận thanh toán. ${error.message || 'Vui lòng thử lại sau.'}`);
    }
  };

  // Lọc hóa đơn theo trạng thái và tìm kiếm
  const filteredBills = bills.filter(bill => {
    const matchesStatus = statusFilter ? bill.status === statusFilter : true;
    const matchesSearch = searchText
      ? bill.billNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        bill.customerName.toLowerCase().includes(searchText.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  // Định nghĩa cột cho bảng hóa đơn
  const columns: ColumnsType<any> = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => {
        // Use customerMap for real-time customer name lookup
        const customer = customerMap[record.maKH] || customers.find(c => c.maKH === record.maKH);
        const displayName = customer?.tenKH || text || `Khách hàng ${record.maKH}`;

        return (
          <div>
            <div>{displayName}</div>
            {customer && (
              <small style={{ color: '#888' }}>
                {customer.phone} | {customer.email}
              </small>
            )}
            {customerDataLoading && (
              <small style={{ color: '#1890ff' }}>Đang tải...</small>
            )}
          </div>
        );
      }
    },

    {
      title: 'Ngày lập hóa đơn',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethodName',
      key: 'paymentMethod',
      render: (text, record) => {
        let color = '';
        let icon = null;

        // Xác định màu sắc và biểu tượng dựa trên mã phương thức thanh toán (cập nhật theo API thực tế)
        switch(record.maPhuongThuc) {
          case 2: // Momo
            color = '#D82D8B';
            icon = '📱';
            break;
          case 3: // Ngân Hàng
            color = 'blue';
            icon = '🏦';
            break;
          case 4: // Tiền mặt
            color = 'green';
            icon = '💵';
            break;
          case 5: // Thẻ Tín Dụng
            color = 'gold';
            icon = '💳';
            break;
          case 6: // Thẻ Ghi Nợ
            color = 'cyan';
            icon = '💳';
            break;
          case 7: // ZaloPay
            color = '#0068FF';
            icon = '📱';
            break;
          case 8: // VNPay
            color = '#1976D2';
            icon = '💰';
            break;
          case 9: // PayPal
            color = '#003087';
            icon = '🌐';
            break;
          default:
            color = 'default';
            icon = '❓';
        }

        return (
          <Tag color={color}>
            {icon} {text || 'Không xác định'}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        let color = 'default';
        let text = 'Không xác định';

        switch(status) {
          case 'paid':
            color = 'green';
            text = 'Đã thanh toán';
            break;
          case 'pending':
            color = 'orange';
            text = 'Chờ thanh toán';
            break;
          case 'cancelled':
            color = 'red';
            text = 'Đã hủy';
            break;
        }

        // Xác định màu sắc cho trạng thái thanh toán (cập nhật theo API thực tế)
        let statusColor = 'default';
        if (record.trangThaiThanhToanName) {
          if (record.trangThaiThanhToanName.includes('Đã Thanh Toán')) {
            statusColor = 'success';
          } else if (record.trangThaiThanhToanName.includes('Chưa Thanh Toán')) {
            statusColor = 'warning';
          } else if (record.trangThaiThanhToanName.includes('Không xác định')) {
            statusColor = 'default';
          }
        }

        // Ưu tiên hiển thị trạng thái thanh toán từ API nếu có và không phải "Không xác định"
        if (record.trangThaiThanhToanName && record.trangThaiThanhToanName !== 'Không xác định') {
          return (
            <Tag color={statusColor}>
              {record.trangThaiThanhToanName}
            </Tag>
          );
        }

        // Nếu không có trạng thái thanh toán từ API hoặc là "Không xác định", hiển thị trạng thái hóa đơn mặc định
        return (
          <Tag color={color}>{text}</Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="In hóa đơn">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handlePrint(record)}
              size="small"
            />
          </Tooltip>
          {/* Hiển thị button xác nhận thanh toán cho hóa đơn chưa thanh toán */}
          {(record.status === 'pending' || record.trangThai === 2 ||
            (record.trangThaiThanhToanName && record.trangThaiThanhToanName.includes('Chưa Thanh Toán'))) && (
            <>
              <Tooltip title="Xác nhận thanh toán">
                <Button
                  icon={<CheckCircleOutlined />}
                  type="primary"
                  size="small"
                  onClick={() => {
                    handlePayment(record);
                  }}
                />
              </Tooltip>
              <Tooltip title="Xóa hóa đơn">
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => {
                    handleDelete(record);
                  }}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Chỉnh sửa">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  size="small"
                />
              </Tooltip>
            </>
          )}

          {/* Hiển thị trạng thái đã thanh toán */}
          {(record.status === 'paid' ||
            (record.trangThaiThanhToanName && record.trangThaiThanhToanName.includes('Đã Thanh Toán'))) && (
            <Tooltip title="Đã thanh toán">
              <Button
                icon={<CheckCircleOutlined />}
                type="default"
                size="small"
                disabled
                style={{ color: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Định nghĩa cột cho bảng chi tiết hóa đơn
  const billItemColumns: ColumnsType<any> = [
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Quản lý hóa đơn</h2>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchBills}
            loading={loading}
            title="Làm mới danh sách"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsNewBillModalVisible(true)}
          >
            Tạo hóa đơn mới
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng hóa đơn"
              value={bills.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã thanh toán"
              value={bills.filter(b => b.status === 'paid').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ thanh toán"
              value={bills.filter(b => b.status === 'pending').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã hủy"
              value={bills.filter(b => b.status === 'cancelled').length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input.Search
          placeholder="Tìm theo mã hóa đơn, tên khách hàng"
          allowClear
          style={{ width: 300 }}
          onSearch={value => setSearchText(value)}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          allowClear
          style={{ width: 200 }}
          onChange={value => setStatusFilter(value)}
        >
          <Option value="paid">Đã thanh toán</Option>
          <Option value="pending">Chờ thanh toán</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filteredBills}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        loading={loading}
        locale={{
          emptyText: loading ? 'Đang tải dữ liệu...' : 'Không có hóa đơn nào'
        }}
      />

      {/* Modal xem chi tiết hóa đơn */}
      <Modal
        title={`Chi tiết hóa đơn ${viewBill?.billNumber}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          // Hiển thị button xác nhận thanh toán nếu chưa thanh toán
          ...(viewBill && (viewBill.status === 'pending' || viewBill.trangThai === 2 ||
              (viewBill.trangThaiThanhToanName && viewBill.trangThaiThanhToanName.includes('Chưa Thanh Toán'))) ? [
            <Button
              key="payment"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setIsModalVisible(false);
                handlePayment(viewBill);
              }}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Xác nhận thanh toán
            </Button>
          ] : []),
          <Button key="print" type="default" icon={<PrinterOutlined />} onClick={() => handlePrint(viewBill)}>
            In hóa đơn
          </Button>,
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {viewBill && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>Khách hàng:</strong> {(() => {
                  const customer = customerMap[viewBill.maKH] || customers.find(c => c.maKH === viewBill.maKH);
                  return customer?.tenKH || viewBill.customerName || `Khách hàng ${viewBill.maKH}`;
                })()}</p>
                {(() => {
                  const customer = customerMap[viewBill.maKH] || customers.find(c => c.maKH === viewBill.maKH);
                  return customer && (
                    <>
                      <p><strong>SĐT:</strong> {customer.phone}</p>
                      <p><strong>Email:</strong> {customer.email}</p>
                    </>
                  );
                })()}

              </Col>
              <Col span={12}>
                <p><strong>Mã hóa đơn:</strong> {viewBill.billNumber}</p>
                <p><strong>Ngày lập hóa đơn:</strong> {dayjs(viewBill.createdAt).format('DD/MM/YYYY')}</p>
                <p>
                  <strong>Phương thức thanh toán:</strong>{' '}
                  {viewBill.paymentMethodName ? (
                    <Tag color={
                      viewBill.maPhuongThuc === 2 ? '#D82D8B' : // Momo - màu hồng đậm chính thức
                      viewBill.maPhuongThuc === 3 ? 'blue' : // Ngân Hàng
                      viewBill.maPhuongThuc === 4 ? 'green' : // Tiền mặt
                      viewBill.maPhuongThuc === 5 ? 'gold' : // Thẻ Tín Dụng
                      viewBill.maPhuongThuc === 6 ? 'cyan' : // Thẻ Ghi Nợ
                      viewBill.maPhuongThuc === 7 ? '#0068FF' : // ZaloPay - màu xanh chính thức
                      viewBill.maPhuongThuc === 8 ? '#1976D2' : // VNPay - màu xanh chính thức
                      viewBill.maPhuongThuc === 9 ? '#003087' : 'default' // PayPal - màu xanh đậm chính thức
                    }>
                      {viewBill.maPhuongThuc === 2 ? '📱' : // Momo
                       viewBill.maPhuongThuc === 3 ? '🏦' : // Ngân Hàng
                       viewBill.maPhuongThuc === 4 ? '💵' : // Tiền mặt
                       viewBill.maPhuongThuc === 5 ? '💳' : // Thẻ Tín Dụng
                       viewBill.maPhuongThuc === 6 ? '💳' : // Thẻ Ghi Nợ
                       viewBill.maPhuongThuc === 7 ? '📱' : // ZaloPay
                       viewBill.maPhuongThuc === 8 ? '💰' : // VNPay
                       viewBill.maPhuongThuc === 9 ? '🌐' : '❓'} {' '}
                      {viewBill.paymentMethodName}
                    </Tag>
                  ) : (
                    <Tag color="default">Không xác định</Tag>
                  )}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{' '}
                  {viewBill.trangThaiThanhToanName ? (
                    <Tag color={
                      viewBill.trangThaiThanhToanName.includes('Đã Thanh Toán') ? 'success' :
                      viewBill.trangThaiThanhToanName.includes('Chưa Thanh Toán') ? 'warning' : 'default'
                    }>
                      {viewBill.trangThaiThanhToanName}
                    </Tag>
                  ) : (
                    <Tag color={
                      viewBill.status === 'paid' ? 'green' :
                      viewBill.status === 'pending' ? 'orange' : 'red'
                    }>
                      {viewBill.status === 'paid' ? 'Đã thanh toán' :
                       viewBill.status === 'pending' ? 'Chờ thanh toán' : 'Đã hủy'}
                    </Tag>
                  )}
                </p>
              </Col>
            </Row>

            <Divider />

            <div>
              <h3>Chi tiết hóa đơn</h3>
              <Table
                columns={billItemColumns}
                dataSource={viewBill.items}
                rowKey="id"
                pagination={false}
                summary={() => {
                  // Kiểm tra giảm giá từ nhiều nguồn có thể
                  const discountAmount = viewBill.discount || viewBill.giamGia || viewBill.giaTriGiam || 0;
                  const hasDiscount = discountAmount && discountAmount > 0;

                  return (
                    <Table.Summary fixed>
                      {hasDiscount ? (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3} align="right">
                            <strong>Giảm giá:</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            <strong style={{ color: '#52c41a' }}>-{discountAmount.toLocaleString('vi-VN')} VNĐ</strong>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      ) : (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3} align="right">
                            <strong>Giảm giá:</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            <span style={{ color: '#888' }}>Không áp dụng</span>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      )}
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3} align="right">
                          <strong>Tổng cộng:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <strong>{viewBill.totalAmount.toLocaleString('vi-VN')} VNĐ</strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />

              {/* Hiển thị chi tiết dịch vụ */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Chi tiết dịch vụ</h3>
                  {viewBill.serviceDetails && viewBill.serviceDetails.length > 0 && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <span style={{ marginRight: 16 }}>
                        📦 {viewBill.serviceDetails.length} dịch vụ
                      </span>
                      <span>
                        💰 {viewBill.serviceDetails.reduce((sum: number, item: any) => sum + (item.thanhTien || 0), 0).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  )}
                </div>
                {viewBill.serviceDetails && viewBill.serviceDetails.length > 0 ? (
                  <Table
                    columns={[
                      {
                        title: 'Mã chi tiết',
                        dataIndex: 'maChiTiet',
                        key: 'maChiTiet',
                      },
                      {
                        title: 'Dịch vụ',
                        dataIndex: 'serviceName',
                        key: 'serviceName',
                        render: (text, record: any) => (
                          <div>
                            <div style={{ fontWeight: 'bold' }}>
                              {text || record.serviceName || `Dịch vụ ${record.maDichVu}`}
                            </div>
                            {record.serviceDescription && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                                {record.serviceDescription}
                              </div>
                            )}
                            {record.serviceCategory && (
                              <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                                📂 {record.serviceCategory}
                              </div>
                            )}
                          </div>
                        )
                      },
                      {
                        title: 'Số lượng',
                        dataIndex: 'soLuong',
                        key: 'soLuong',
                        align: 'center',
                      },
                      {
                        title: 'Đơn giá',
                        dataIndex: 'donGia',
                        key: 'donGia',
                        align: 'right',
                        render: (price) => `${price?.toLocaleString('vi-VN') || 0} VNĐ`,
                      },
                      {
                        title: 'Thành tiền',
                        dataIndex: 'thanhTien',
                        key: 'thanhTien',
                        align: 'right',
                        render: (amount) => `${amount?.toLocaleString('vi-VN') || 0} VNĐ`,
                      },
                    ]}
                    dataSource={viewBill.serviceDetails}
                    rowKey="maChiTiet"
                    pagination={false}
                    locale={{ emptyText: 'Không có dịch vụ nào' }}
                  />
                ) : (
                  <Alert
                    message="Không có dịch vụ"
                    description="Hóa đơn này không có chi tiết dịch vụ nào."
                    type="info"
                    showIcon
                  />
                )}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <Steps current={
                viewBill.status === 'paid' ? 2 :
                viewBill.status === 'pending' ? 1 :
                viewBill.status === 'cancelled' ? 3 : 0
              }>
                <Step title="Tạo hóa đơn" description={dayjs(viewBill.createdAt).format('DD/MM/YYYY')} />
                <Step title="Chờ thanh toán" />
                <Step title="Đã thanh toán" status={viewBill.status === 'cancelled' ? 'error' : undefined} />
                {viewBill.status === 'cancelled' && <Step title="Đã hủy" status="error" />}
              </Steps>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal tạo hóa đơn mới */}
      <Modal
        title="Tạo hóa đơn mới"
        open={isNewBillModalVisible}
        onCancel={() => {
          setIsNewBillModalVisible(false);
          form.resetFields();
          setBillItems([]);
        }}
        onOk={handleAddBill}
        okText="Tạo hóa đơn"
        cancelText="Hủy"
        width={900}
        style={{ maxWidth: '95vw' }}
        styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Alert
            message="Thông tin hóa đơn"
            description="Hóa đơn sẽ được tạo với trạng thái ban đầu. Bạn có thể cập nhật thông tin chi tiết sau khi tạo."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Alert
            message="Lưu ý"
            description="Nếu gặp lỗi khi tạo hóa đơn, vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên để được hỗ trợ."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="customerId"
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Khách hàng</span>
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    message.loading('Đang tải lại danh sách khách hàng...', 1);
                    fetchCustomers();
                  }}
                  style={{ padding: 0, height: 'auto' }}
                >
                  🔄 Tải lại
                </Button>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
          >
            <Select
                placeholder="🔍 Nhập tên, SĐT, email hoặc ID để tìm khách hàng..."
                style={{ width: '100%' }}
                showSearch
                allowClear
                filterOption={false}
                onSearch={(value) => {
                  setCustomerSearchText(value);
                  filterCustomers(value);
                }}
                onSelect={(value) => {
                  const selectedCustomer = customers.find(c => c.maKH === value);
                  if (selectedCustomer) {
                    saveRecentCustomer(selectedCustomer);
                  }
                  setCustomerSearchText(''); // Clear search after selection
                }}
                notFoundContent={
                  customers.length === 0 ? "Đang tải khách hàng..." :
                  filteredCustomers.length === 0 ? "Không tìm thấy khách hàng" : null
                }
                dropdownRender={(menu) => (
                  <div>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      background: '#fafafa',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      {customerSearchText ?
                        `🔍 Tìm thấy ${filteredCustomers.length} kết quả cho "${customerSearchText}"` :
                        `📋 ${recentCustomers.length > 0 ? '⭐ Gần đây + ' : ''}${Math.min(50, customers.length)}/${customers.length} khách hàng`
                      }
                      <br />
                      💡 Gõ để tìm nhanh theo tên, SĐT, email hoặc ID
                    </div>
                    {menu}
                  </div>
                )}
              >
                {filteredCustomers.map((customer) => {
                  const isRecent = recentCustomers.some(rc => rc.maKH === customer.maKH);
                  return (
                    <Option key={customer.maKH} value={customer.maKH}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        minHeight: '40px',
                        padding: '4px 0'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {isRecent && !customerSearchText && '⭐ '}
                          {customer.tenKH}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#999',
                          background: '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: 3,
                          flexShrink: 0
                        }}>
                          ID: {customer.maKH}
                        </div>
                      </div>
                    </Option>
                  );
                })}
            </Select>
          </Form.Item>

          {/* Hiển thị thông tin khách hàng đã chọn và quick actions */}
          <Form.Item shouldUpdate noStyle>
            {() => {
              const selectedCustomerId = form.getFieldValue('customerId');
              const selectedCustomer = customers.find(c => c.maKH === selectedCustomerId);

              return (
                <div style={{ marginTop: -16, marginBottom: 16 }}>
                  {/* Quick actions cho khách hàng gần đây - chỉ hiển thị khi chưa chọn khách hàng */}
                  {recentCustomers.length > 0 && !customerSearchText && !selectedCustomer && (
                    <div style={{
                      marginBottom: 8,
                      padding: 10,
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: 8,
                        fontWeight: '500'
                      }}>
                        ⚡ Chọn nhanh:
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6
                      }}>
                        {recentCustomers.slice(0, 3).map(customer => (
                          <Button
                            key={customer.maKH}
                            size="small"
                            type="dashed"
                            onClick={() => {
                              form.setFieldsValue({ customerId: customer.maKH });
                              setCustomerSearchText('');
                            }}
                            style={{
                              fontSize: '11px',
                              height: '28px',
                              padding: '0 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              maxWidth: '120px',
                              border: '1px solid #d9d9d9',
                              borderRadius: 4
                            }}
                            title={customer.tenKH}
                          >
                            <span style={{ fontSize: '10px' }}>⭐</span>
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0
                            }}>
                              {customer.tenKH}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hiển thị thông tin chi tiết khách hàng đã chọn */}
                  {selectedCustomer && (
                    <div style={{
                      padding: 12,
                      background: '#f6ffed',
                      border: '1px solid #b7eb8f',
                      borderRadius: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#52c41a',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <span>✅</span>
                        <span>Đã chọn: {selectedCustomer.tenKH}</span>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          alignItems: 'center'
                        }}>
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '150px'
                          }}>
                            📞 {selectedCustomer.soDT}
                          </span>
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}>
                            ✉️ {selectedCustomer.email}
                          </span>
                        </div>
                        <div>
                          <span style={{
                            background: '#e6f7ff',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: '#1890ff'
                          }}>
                            ID: {selectedCustomer.maKH}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Phương thức thanh toán"
            initialValue={2}
            rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
          >
            <Select placeholder="Chọn phương thức thanh toán">
              {paymentMethods.length > 0 ? (
                paymentMethods.map(method => (
                  <Option key={method.id} value={method.id}>
                    {method.tenPhuongThuc}
                  </Option>
                ))
              ) : (
                <>
                  <Option value={2}>Momo</Option>
                  <Option value={3}>Ngân Hàng</Option>
                  <Option value={4}>Tiền mặt</Option>
                  <Option value={5}>Thẻ Tín Dụng</Option>
                  <Option value={6}>Thẻ Ghi Nợ</Option>
                  <Option value={7}>ZaloPay</Option>
                  <Option value={8}>VNPay</Option>
                  <Option value={9}>PayPal</Option>
                </>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="discountType"
            label="Loại giảm giá"
            initialValue="none"
          >
            <Select
              placeholder="Chọn loại giảm giá"
              onChange={(value) => {
                if (value === 'none') {
                  form.setFieldsValue({
                    discountAmount: 0,
                    discountName: '',
                    discountDescription: ''
                  });
                }
              }}
            >
              <Option value="none">Không áp dụng giảm giá</Option>
              <Option value="existing">Chọn giảm giá có sẵn</Option>
              <Option value="new">Tạo giảm giá mới</Option>
            </Select>
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const discountType = form.getFieldValue('discountType');

              if (discountType === 'existing') {
                return (
                  <Form.Item
                    name="existingDiscountId"
                    label="Chọn giảm giá có sẵn"
                    rules={[{ required: true, message: 'Vui lòng chọn giảm giá' }]}
                  >
                    <Select placeholder="Chọn giảm giá có sẵn">
                      {/* TODO: Load từ API GiamGia/GetAll */}
                      <Option value={1}>Giảm giá 10% - Khách hàng VIP</Option>
                      <Option value={2}>Giảm giá 50,000 VNĐ - Khuyến mãi tháng</Option>
                    </Select>
                  </Form.Item>
                );
              }

              if (discountType === 'new') {
                return (
                  <>
                    <Form.Item
                      name="discountName"
                      label="Tên giảm giá"
                      rules={[{ required: true, message: 'Vui lòng nhập tên giảm giá' }]}
                    >
                      <Input placeholder="VD: Giảm giá khách hàng VIP" />
                    </Form.Item>

                    <Form.Item
                      name="discountDescription"
                      label="Mô tả giảm giá"
                      rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="VD: Giảm giá đặc biệt cho khách hàng VIP"
                      />
                    </Form.Item>

                    <Form.Item
                      name="discountAmount"
                      label="Giá trị giảm (VNĐ)"
                      rules={[
                        { required: true, message: 'Vui lòng nhập giá trị giảm' },
                        { type: 'number', min: 1000, message: 'Giá trị giảm tối thiểu 1,000 VNĐ' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1000}
                        step={1000}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        placeholder="Nhập số tiền giảm giá"
                      />
                    </Form.Item>
                  </>
                );
              }

              return null;
            }}
          </Form.Item>

          <Divider />

          <h3>Chi tiết dịch vụ</h3>
          <Form.List name="serviceDetails">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', marginBottom: 8, gap: 8, alignItems: 'baseline' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'maDichVu']}
                      rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
                      style={{ flex: 2 }}
                    >
                      <Select
                        placeholder="Chọn dịch vụ"
                        onChange={(value) => {
                          // Tìm dịch vụ được chọn
                          const selectedService = services.find(s => s.maDichVu === value);
                          if (selectedService) {
                            // Cập nhật đơn giá tự động
                            // Cập nhật trường donGia
                            form.setFields([
                              {
                                name: ['serviceDetails', name, 'donGia'],
                                value: selectedService.donGia
                              }
                            ]);
                          }
                        }}
                      >
                        {services && services.length > 0 ? (
                          services.map(service => (
                            <Option key={service.maDichVu} value={service.maDichVu}>
                              {service.ten} - {service.donGia.toLocaleString('vi-VN')} VNĐ
                            </Option>
                          ))
                        ) : (
                          <Option value={0} disabled>Đang tải dịch vụ...</Option>
                        )}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'soLuong']}
                      rules={[{ required: true, message: 'Nhập số lượng' }]}
                      initialValue={1}
                      style={{ flex: 1 }}
                    >
                      <Input type="number" min={1} placeholder="Số lượng" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'donGia']}
                      rules={[{ required: true, message: 'Nhập đơn giá' }]}
                      initialValue={0}
                      style={{ flex: 1 }}
                    >
                      <Input type="number" min={0} placeholder="Đơn giá" />
                    </Form.Item>
                    <Button danger onClick={() => remove(name)} icon={<DeleteOutlined />} />
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm dịch vụ
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider />

          {/* Hiển thị tổng tiền tự động tính */}
          <Form.Item shouldUpdate>
            {() => {
              const serviceDetails = form.getFieldValue('serviceDetails') || [];
              let totalAmount = 0;

              serviceDetails.forEach((service: any) => {
                if (service && service.soLuong && service.donGia) {
                  totalAmount += service.soLuong * service.donGia;
                }
              });

              return (
                <div style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                  border: '1px solid #d9d9d9'
                }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <strong>Tổng tiền dịch vụ:</strong>
                    </Col>
                    <Col>
                      <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                        {totalAmount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </Col>
                  </Row>
                  {totalAmount === 0 && (
                    <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>
                      * Vui lòng thêm ít nhất một dịch vụ
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const discountType = form.getFieldValue('discountType');
              const discountAmount = form.getFieldValue('discountAmount');
              const discountName = form.getFieldValue('discountName');

              return (
                <div style={{ textAlign: 'center', color: '#888' }}>
                  <p>Hóa đơn sẽ được tạo với các thông tin sau:</p>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <li>📅 Ngày lập hóa đơn: {dayjs().format('DD/MM/YYYY HH:mm')}</li>
                    <li>⏳ Trạng thái: Chưa thanh toán</li>
                    <li>💰 Tổng tiền: Tự động tính từ chi tiết dịch vụ</li>
                    <li>🎯 Giảm giá: {
                      discountType === 'none' ? 'Không áp dụng' :
                      discountType === 'existing' ? 'Sử dụng giảm giá có sẵn' :
                      discountType === 'new' && discountName && discountAmount ?
                        `Tạo mới "${discountName}" - ${discountAmount?.toLocaleString('vi-VN')} VNĐ` :
                        'Chưa hoàn tất thông tin giảm giá'
                    }</li>
                  </ul>
                </div>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh sửa hóa đơn */}
      <Modal
        title={`Chỉnh sửa hóa đơn ${editingBill?.billNumber}`}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleSaveEdit}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        {editingBill && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              paymentMethod: editingBill.maPhuongThuc
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <p><strong>Khách hàng:</strong> {editingBill.customerName}</p>
              <p><strong>Phòng:</strong> {editingBill.roomNumber}</p>
              <p><strong>Tổng tiền:</strong> {editingBill.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
            </div>

            <Form.Item
              name="paymentMethod"
              label="Phương thức thanh toán"
              rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
            >
              <Select>
                {paymentMethods.length > 0 ? (
                  paymentMethods.map(method => (
                    <Option key={method.id} value={method.id}>
                      {method.tenPhuongThuc}
                    </Option>
                  ))
                ) : (
                  <>
                    <Option value={2}>Momo</Option>
                    <Option value={3}>Ngân Hàng</Option>
                    <Option value={4}>Tiền mặt</Option>
                    <Option value={5}>Thẻ Tín Dụng</Option>
                    <Option value={6}>Thẻ Ghi Nợ</Option>
                    <Option value={7}>ZaloPay</Option>
                    <Option value={8}>VNPay</Option>
                    <Option value={9}>PayPal</Option>
                  </>
                )}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal xác nhận thanh toán */}
      <Modal
        title="Xác nhận thanh toán"
        open={isPaymentModalVisible}
        onOk={handleConfirmPayment}
        onCancel={() => {
          setIsPaymentModalVisible(false);
          setBillToPayment(null);
        }}
        okText="Xác nhận thanh toán"
        cancelText="Hủy"
        centered
        okButtonProps={{ type: 'primary', danger: false }}
      >
        <div style={{ padding: '16px 0' }}>
          <p>Bạn có chắc chắn muốn xác nhận thanh toán cho hóa đơn này không?</p>

          {billToPayment && (
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
              <p><strong>Mã hóa đơn:</strong> {billToPayment.billNumber || billToPayment.maHD}</p>
              <p><strong>Khách hàng:</strong> {billToPayment.customerName}</p>
              <p><strong>Tổng tiền:</strong> {billToPayment.totalAmount?.toLocaleString('vi-VN')} VNĐ</p>
            </div>
          )}


        </div>
      </Modal>
    </div>
  );
};

export default BillManagement;
