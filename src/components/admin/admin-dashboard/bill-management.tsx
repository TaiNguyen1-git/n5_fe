import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Space, Modal, Input, InputNumber, Select, Form, Card, Statistic, Row, Col, Tooltip, Divider, message, Alert, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, PrinterOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';
import { getAllCustomers, type Customer } from '../../../services/customerService';
import { calculateBill, createCalculatedBill, BillCalculation } from '../../../services/billCalculationService';

const { Option } = Select;
const BASE_URL = '/api';

const BillManagement = () => {
  // State variables
  const [bills, setBills] = useState<any[]>([]);
  const [viewBill, setViewBill] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewBillModalVisible, setIsNewBillModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);

  // Customer data states
  const [customerMap, setCustomerMap] = useState<Record<number, Customer>>({});
  const [customerDataLoading, setCustomerDataLoading] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [customerPagination, setCustomerPagination] = useState({
    totalItems: 0,
    pageNumber: 1,
    pageSize: 50,
    totalPages: 0
  });
  const [isSearching, setIsSearching] = useState(false);

  // Payment modal states
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [billToPayment, setBillToPayment] = useState<any>(null);

  // Bill calculation states
  const [billCalculation, setBillCalculation] = useState<BillCalculation | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [selectedCustomerForBill, setSelectedCustomerForBill] = useState<number | null>(null);

  // Form states for new bill
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [manualTotal, setManualTotal] = useState<number>(0);

  // Load data on component mount
  useEffect(() => {
    fetchBills();
    fetchCustomers('', 1); // Load initial customers
    fetchPaymentMethods();
    fetchPaymentStatuses();
    fetchServices();
    fetchDiscounts();
    fetchCustomerData();
  }, []);

  // Fetch customer data using customerService
  const fetchCustomerData = async () => {
    setCustomerDataLoading(true);
    try {
      const response = await getAllCustomers(1, 1000);
      if (response.success && response.data?.items) {
        const customerMapData: Record<number, Customer> = {};
        response.data.items.forEach((customer: Customer) => {
          if (customer.maKH) {
            customerMapData[customer.maKH] = customer;
          }
        });
        setCustomerMap(customerMapData);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setCustomerDataLoading(false);
    }
  };

  // Helper function to get payment method name
  const getPaymentMethodName = (maPhuongThuc: number | null | undefined): string => {
    const method = paymentMethods.find(m => m.id === maPhuongThuc);
    if (method && method.tenPhuongThuc) {
      return method.tenPhuongThuc.trim();
    }
    
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

  // Helper function to get payment status name
  const getPaymentStatusName = (maTrangThai: number | null | undefined): string => {
    if (maTrangThai === null || maTrangThai === undefined) {
      return 'Chưa Thanh Toán';
    }

    const status = paymentStatuses.find(s => s.id === maTrangThai);
    if (status && status.tenTT) {
      return status.tenTT;
    }

    switch (maTrangThai) {
      case 0: return 'Đã Hủy';
      case 1: return 'Đã Thanh Toán';
      case 2: return 'Chưa Thanh Toán';
      case 3: return 'Đang Xử Lý';
      default: return `Trạng thái ${maTrangThai}`;
    }
  };

  // Sample data for fallback
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
    }
  ];

  // Fetch bills from backend
  const fetchBills = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await axios.get(`${BASE_URL}/HoaDon/GetAll`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.data) {
          const billsData = Array.isArray(response.data) ? response.data : [response.data];
          const formattedBills = billsData.map((bill: any) => {
            if (!bill) return null;

            const phongThue = bill.phongThueThanhToans && bill.phongThueThanhToans.length > 0
              ? bill.phongThueThanhToans[0]
              : null;

            const maKH = bill.maKH;
            const customer = customerMap[maKH];
            const customerName = customer?.tenKH ||
                                customers.find(c => c.maKH === maKH)?.tenKH ||
                                phongThue?.tenKH ||
                                `Khách hàng ${maKH}`;

            const roomNumber = phongThue?.maPhong || bill.maPhong || 'N/A';
            const checkIn = phongThue?.ngayBatDau || bill.ngayBatDau || bill.ngayTao;
            const checkOut = phongThue?.ngayKetThuc || bill.ngayKetThuc || bill.ngayTao;

            let items = [];
            if (bill.chiTietHoaDonDVs && bill.chiTietHoaDonDVs.length > 0) {
              items = bill.chiTietHoaDonDVs.map((item: any) => ({
                id: item.maChiTiet || Date.now() + Math.random(),
                description: item.dichVu?.ten || 'Dịch vụ',
                quantity: item.soLuong || 1,
                price: item.donGia || 0,
                amount: item.thanhTien || (item.soLuong * item.donGia) || 0
              }));
            }

            if (phongThue) {
              items.push({
                id: `room-${phongThue.maPhong || Date.now()}`,
                description: `Tiền phòng ${phongThue.maPhong || ''}`,
                quantity: 1,
                price: phongThue.donGia || 0,
                amount: phongThue.thanhTien || phongThue.donGia || 0
              });
            }

            if (items.length === 0) {
              items = [{
                id: 1,
                description: 'Tổng hóa đơn',
                quantity: 1,
                price: bill.tongTien || 0,
                amount: bill.tongTien || 0
              }];
            }

            let createdAt = bill.ngayLapHD || bill.ngayTao;
            if (!createdAt || !dayjs(createdAt).isValid()) {
              if (phongThue && phongThue.ngayBatDau && dayjs(phongThue.ngayBatDau).isValid()) {
                createdAt = phongThue.ngayBatDau;
              } else {
                createdAt = new Date().toISOString();
              }
            }

            const discount = bill.giamGia !== undefined ? bill.giamGia : null;
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
              paymentMethodName: getPaymentMethodName(bill.maPhuongThuc),
              status: bill.trangThai === 1 ? 'paid' : bill.trangThai === 2 ? 'pending' : 'cancelled',
              maKH: bill.maKH,
              maPhuongThuc: bill.maPhuongThuc,
              trangThai: bill.trangThai,
              trangThaiThanhToan: bill.trangThaiThanhToan,
              trangThaiThanhToanName: getPaymentStatusName(bill.trangThaiThanhToan || bill.trangThai),
              items: items,
              discount: discount,
              maGiam: bill.maGiam,
              ngayLapHD: bill.ngayLapHD,
              tongTien: bill.tongTien,
              serviceDetails: serviceDetails
            };
          }).filter(Boolean);

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
      setBills(sampleBills);
    } finally {
      setLoading(false);
    }
  };

  // Sample payment methods
  const samplePaymentMethods = [
    { id: 1, tenPhuongThuc: "Tiền mặt", moTa: "Thanh toán bằng Tiền mặt", trangThai: true },
    { id: 2, tenPhuongThuc: "Thẻ", moTa: "Thanh toán bằng Thẻ", trangThai: true },
    { id: 3, tenPhuongThuc: "Chuyển khoản", moTa: "Thanh toán bằng Chuyển khoản", trangThai: true },
    { id: 4, tenPhuongThuc: "Ví điện tử", moTa: "Thanh toán bằng Ví điện tử", trangThai: true }
  ];

  // Sample payment statuses
  const samplePaymentStatuses = [
    { id: 1, tenTT: "Đã Thanh Toán" },
    { id: 2, tenTT: "Chưa Thanh Toán" }
  ];

  // Fetch payment methods from backend
  const fetchPaymentMethods = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await axios.get(`${BASE_URL}/PhuongThucThanhToan/GetAll`);
        clearTimeout(timeoutId);

        if (response.data) {
          const methodsData = Array.isArray(response.data) ? response.data : [response.data];
          const formattedMethods = methodsData
            .filter((method: any) => method && (method.id || method.maDonVi !== undefined))
            .map((method: any) => ({
              id: method.id || Date.now(),
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
      setPaymentMethods(samplePaymentMethods);
    }
  };

  // Fetch payment statuses from backend
  const fetchPaymentStatuses = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await axios.get(`${BASE_URL}/TrangThaiThanhToan/GetAll`);
        clearTimeout(timeoutId);

        if (response.data) {
          const statusesData = Array.isArray(response.data) ? response.data : [response.data];
          const formattedStatuses = statusesData
            .filter((status: any) => status && (status.id !== undefined || status.maDonVi !== undefined))
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
      setPaymentStatuses(samplePaymentStatuses);
    }
  };

  // Fetch discounts from backend
  const fetchDiscounts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/GiamGia/GetAll`);

      if (response.data) {
        let discountsData = [];

        // Handle different response structures from the proxy API
        if (response.data.success && response.data.data) {
          // Handle proxy API response structure
          if (Array.isArray(response.data.data)) {
            discountsData = response.data.data;
          } else if (response.data.data.items && Array.isArray(response.data.data.items)) {
            discountsData = response.data.data.items;
          } else if (response.data.data.value && Array.isArray(response.data.data.value)) {
            discountsData = response.data.data.value;
          }
        } else if (response.data.items && Array.isArray(response.data.items)) {
          discountsData = response.data.items;
        } else if (response.data.value && Array.isArray(response.data.value)) {
          discountsData = response.data.value;
        } else if (Array.isArray(response.data)) {
          discountsData = response.data;
        }

        const validDiscounts = discountsData
          .filter((discount: any) => {
            if (!discount) return false;
            // Only filter by status if it exists, otherwise include all
            if (discount.trangThai !== undefined && !discount.trangThai) return false;
            if (discount.ngayKetThuc) {
              const endDate = new Date(discount.ngayKetThuc);
              const now = new Date();
              const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              if (endDate < oneDayAgo) return false;
            }
            return true;
          })
          .map((discount: any) => ({
            // Map the correct field names from the API response
            maGiam: discount.id || discount.maGiam,
            tenGG: discount.tenMa || discount.tenGG || `Giảm giá ${discount.id || discount.maGiam}`,
            giaTriGiam: discount.giaTri || discount.giaTriGiam || 0,
            ngayKetThuc: discount.ngayKetThuc,
            trangThai: discount.trangThai !== undefined ? discount.trangThai : true
          }));

        setDiscounts(validDiscounts);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setDiscounts([]);
    }
  };

  // Fetch services from backend
  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services', {
        params: { pageSize: 100 },
        timeout: 15000
      });

      if (response.data && response.data.success && response.data.data?.items) {
        const formattedServices = response.data.data.items
          .filter((service: any) => service && service.maDichVu && service.trangThai)
          .map((service: any) => ({
            maDichVu: service.maDichVu,
            ten: service.ten || 'Dịch vụ không tên',
            gia: service.gia || 0,
            moTa: service.moTa || '',
            trangThai: service.trangThai
          }));


        setServices(formattedServices);
      } else {

        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  // Fetch customers from backend using proxy API
  const fetchCustomers = async (searchText: string = '', pageNumber: number = 1) => {
    try {
      setCustomerDataLoading(true);

      const response = await axios.get('/api/customers', {
        params: {
          pageNumber: pageNumber,
          pageSize: 100, // Tăng pageSize để lấy nhiều khách hàng hơn
          search: searchText.trim() // Thêm tham số tìm kiếm nếu API hỗ trợ
        },
        timeout: 15000
      });

      if (response.data && response.data.success && response.data.data?.items) {
        const formattedCustomers = response.data.data.items
          .filter((customer: any) => customer && customer.maKH && !customer.xoa)
          .map((customer: any) => ({
            maKH: customer.maKH,
            tenKH: customer.tenKH || 'Khách hàng không tên',
            email: customer.email || '',
            phone: customer.phone || '',
            maVaiTro: customer.maVaiTro,
            xoa: customer.xoa
          }));

        // Cập nhật thông tin phân trang
        setCustomerPagination({
          totalItems: response.data.data.totalItems || 0,
          pageNumber: response.data.data.pageNumber || pageNumber,
          pageSize: response.data.data.pageSize || 100,
          totalPages: response.data.data.totalPages || 0
        });

        if (pageNumber === 1) {
          // Nếu là trang đầu tiên, thay thế toàn bộ danh sách
          setCustomers(formattedCustomers);
          setFilteredCustomers(formattedCustomers);
        } else {
          // Nếu là trang tiếp theo, thêm vào danh sách hiện tại
          setCustomers(prev => [...prev, ...formattedCustomers]);
          setFilteredCustomers(prev => [...prev, ...formattedCustomers]);
        }
      } else {
        if (pageNumber === 1) {
          setCustomers([]);
          setFilteredCustomers([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      if (pageNumber === 1) {
        message.error('Không thể tải danh sách khách hàng');
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } finally {
      setCustomerDataLoading(false);
    }
  };

  // Save recent customer selection
  const saveRecentCustomer = (customer: Customer) => {
    const recent = recentCustomers.filter(c => c.maKH !== customer.maKH);
    const newRecent = [customer, ...recent].slice(0, 5);
    setRecentCustomers(newRecent);
    localStorage.setItem('recentCustomers', JSON.stringify(newRecent));
  };

  // Load recent customers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentCustomers');
    if (saved) {
      try {
        setRecentCustomers(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent customers:', error);
      }
    }
  }, []);

  // Debounce utility function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchText: string) => {
      if (searchText.trim()) {
        setIsSearching(true);
        fetchCustomers(searchText, 1).finally(() => setIsSearching(false));
      } else {
        // Nếu không có text tìm kiếm, load lại danh sách ban đầu
        fetchCustomers('', 1);
      }
    }, 500), // Delay 500ms
    []
  );

  // Handle customer search with debounce
  const handleCustomerSearch = (searchText: string) => {
    setCustomerSearchText(searchText);
    debouncedSearch(searchText);
  };

  // Filter customers locally (for immediate feedback while typing)
  const getDisplayCustomers = () => {
    if (!customerSearchText.trim()) {
      return filteredCustomers.slice(0, 50);
    }

    const searchLower = customerSearchText.toLowerCase();
    const localFiltered = filteredCustomers.filter(customer =>
      customer.tenKH?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchText) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.maKH?.toString().includes(customerSearchText)
    );

    return localFiltered.slice(0, 50);
  };



  // Handle delete bill
  const handleDelete = (billRecord: any) => {
    try {
      if (!billRecord) {
        message.error('Không tìm thấy thông tin hóa đơn để xóa');
        return;
      }

      const maHD = billRecord.maHD || billRecord.id;
      const billNumber = billRecord.billNumber || `HD${String(maHD).padStart(3, '0')}`;

      Modal.confirm({
        title: 'Xác nhận xóa hóa đơn',
        content: `Bạn có chắc chắn muốn xóa hóa đơn ${billNumber}?`,
        okText: 'Xóa',
        cancelText: 'Hủy',
        okType: 'danger',
        onOk: async () => {
          try {
            const updatedBills = bills.filter(bill => {
              const currentBillId = bill.maHD || bill.id;
              return currentBillId !== maHD;
            });
            setBills(updatedBills);
            message.success(`Đã xóa hóa đơn ${billNumber}`);
          } catch (error: any) {
            message.error(`Không thể xóa hóa đơn. ${error.message || 'Vui lòng thử lại sau.'}`);
          }
        }
      });
    } catch (error: any) {
      message.error(`Lỗi khi xóa hóa đơn: ${error.message || 'Vui lòng thử lại sau.'}`);
    }
  };

  // Create detailed bill items for view
  const createDetailedBillItems = async (bill: any) => {
    const items = [];

    try {
      // 1. Get booking info to calculate room charges
      const bookingResponse = await axios.get('/api/booking', {
        params: { userId: bill.maKH },
        timeout: 10000
      });

      if (bookingResponse.data?.success && bookingResponse.data.data) {
        const bookings = Array.isArray(bookingResponse.data.data)
          ? bookingResponse.data.data
          : bookingResponse.data.data.items || [];

        const booking = bookings.find((b: any) => !b.xoa && b.trangThai !== 5);

        if (booking) {
          // Add room charges
          const checkInDate = dayjs(booking.checkIn);
          const checkOutDate = dayjs(booking.checkOut);
          const soNgay = Math.max(1, checkOutDate.diff(checkInDate, 'day'));

          // Get room info for pricing
          let roomPrice = 500000; // Default price
          try {
            const roomResponse = await axios.get('/api/rooms', {
              params: { id: booking.maPhong },
              timeout: 10000
            });
            if (roomResponse.data?.success && roomResponse.data.data) {
              roomPrice = roomResponse.data.data.loaiPhong?.giaPhong || roomPrice;
            }
          } catch (error) {
            console.error('Error fetching room price:', error);
          }

          items.push({
            id: 'room-charge',
            description: `Tiền phòng ${booking.maPhong} (${soNgay} ngày)`,
            quantity: soNgay,
            price: roomPrice,
            amount: roomPrice * soNgay
          });
        }
      }

      // 2. Get service usage details
      const serviceResponse = await axios.get('/api/service-usage', {
        params: { pageSize: 1000 },
        timeout: 10000
      });

      if (serviceResponse.data?.success && serviceResponse.data.data?.items) {
        const allServices = serviceResponse.data.data.items;

        const customerServices = allServices.filter((usage: any) =>
          usage.maKH === bill.maKH && !usage.xoa
        );

        for (const usage of customerServices) {
          let serviceName = `Dịch vụ ${usage.maDV}`;
          let servicePrice = usage.thanhTien / (usage.soLuong || 1);

          // First try to get from loaded services
          const loadedService = services.find(s => s.maDichVu === usage.maDV);
          if (loadedService) {
            serviceName = loadedService.ten;
            servicePrice = loadedService.gia || servicePrice;
          } else {
            // Fallback to hardcoded service names
            if (usage.maDV === 1) {
              serviceName = 'Giặt ủi';
              servicePrice = 100000;
            } else if (usage.maDV === 2) {
              serviceName = 'Buffet';
              servicePrice = 500000;
            } else {
              // Try to get from API as last resort
              try {
                const serviceDetailResponse = await axios.get('/api/services', {
                  params: { id: usage.maDV },
                  timeout: 5000
                });
                if (serviceDetailResponse.data?.success && serviceDetailResponse.data.data) {
                  serviceName = serviceDetailResponse.data.data.ten || serviceName;
                  servicePrice = serviceDetailResponse.data.data.gia || servicePrice;
                }
              } catch (error) {
                console.error('Error fetching service details:', error);
              }
            }
          }

          items.push({
            id: `service-${usage.maSDDV}`,
            description: serviceName,
            quantity: usage.soLuong || 1,
            price: servicePrice,
            amount: usage.thanhTien || (servicePrice * (usage.soLuong || 1))
          });
        }
      }

      // 3. If no room items found but we have a total, try to estimate
      if (items.length === 0 && bill.totalAmount > 0) {
        // Try to break down the total based on typical pricing
        const estimatedRoomDays = Math.ceil(bill.totalAmount / 500000); // Assume 500k per day
        const roomAmount = estimatedRoomDays * 500000;
        const serviceAmount = bill.totalAmount - roomAmount;

        items.push({
          id: 'estimated-room',
          description: `Tiền phòng (ước tính ${estimatedRoomDays} ngày)`,
          quantity: estimatedRoomDays,
          price: 500000,
          amount: roomAmount
        });

        if (serviceAmount > 0) {
          items.push({
            id: 'estimated-services',
            description: 'Dịch vụ đã sử dụng',
            quantity: 1,
            price: serviceAmount,
            amount: serviceAmount
          });
        }
      }

      // 4. Final fallback - single total item
      if (items.length === 0) {
        items.push({
          id: 'total-bill',
          description: 'Tổng hóa đơn',
          quantity: 1,
          price: bill.totalAmount || 0,
          amount: bill.totalAmount || 0
        });
      }

    } catch (error) {
      console.error('Error creating detailed bill items:', error);
      // Fallback to simple total
      items.push({
        id: 'total-bill',
        description: 'Tổng hóa đơn',
        quantity: 1,
        price: bill.totalAmount || 0,
        amount: bill.totalAmount || 0
      });
    }

    return items;
  };

  // Handle view bill details
  const handleView = async (bill: any) => {
    try {
      // Create detailed items
      const detailedItems = await createDetailedBillItems(bill);

      // Fetch service details from ChiTietHoaDonDV API
      let serviceDetails = [];
      try {
        const serviceDetailsResponse = await fetch(`${BASE_URL}/ChiTietHoaDonDV/GetAll`);
        if (serviceDetailsResponse.ok) {
          const serviceDetailsData = await serviceDetailsResponse.json();

          // Handle different API response structures
          let allServiceDetails = [];
          if (serviceDetailsData && serviceDetailsData.value && Array.isArray(serviceDetailsData.value)) {
            allServiceDetails = serviceDetailsData.value;
          } else if (serviceDetailsData && serviceDetailsData.items && Array.isArray(serviceDetailsData.items)) {
            allServiceDetails = serviceDetailsData.items;
          } else if (Array.isArray(serviceDetailsData)) {
            allServiceDetails = serviceDetailsData;
          }

          // Filter service details for this specific bill
          const billId = bill.maHD || bill.id;
          serviceDetails = allServiceDetails.filter((detail: any) =>
            detail.maHD === billId && !detail.xoa
          );

          // Enrich service details with service information
          for (let detail of serviceDetails) {
            try {
              const serviceResponse = await fetch(`${BASE_URL}/DichVu/GetById/${detail.maDichVu}`);
              if (serviceResponse.ok) {
                const serviceData = await serviceResponse.json();
                detail.tenDichVu = serviceData.ten || `Dịch vụ ${detail.maDichVu}`;
                detail.moTaDichVu = serviceData.moTa || '';
                detail.donGia = detail.donGia || serviceData.gia || 0;
              }
            } catch (serviceError) {
              console.error(`Error fetching service ${detail.maDichVu}:`, serviceError);
              // Fallback service names and prices
              if (detail.maDichVu === 1) {
                detail.tenDichVu = 'Giặt ủi';
                detail.donGia = detail.donGia || 100000;
              } else if (detail.maDichVu === 2) {
                detail.tenDichVu = 'Buffet';
                detail.donGia = detail.donGia || 500000;
              } else {
                detail.tenDichVu = `Dịch vụ ${detail.maDichVu}`;
                detail.donGia = detail.donGia || 0;
              }
            }
          }

          console.log(`Found ${serviceDetails.length} service details for bill ${billId}`);
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        // Fallback to existing serviceDetails from bill object
        serviceDetails = bill.serviceDetails || [];
      }

      // Get discount info
      let discountInfo = null;
      if (bill.maGiam && bill.maGiam > 1) {
        try {
          // Try to get discount from our loaded discounts first
          discountInfo = discounts.find(d => d.maGiam === bill.maGiam);

          if (!discountInfo) {
            const discountResponse = await axios.get(`${BASE_URL}/GiamGia/GetById/${bill.maGiam}`, {
              timeout: 5000
            });
            if (discountResponse.data) {
              discountInfo = discountResponse.data;
            }
          }
        } catch (error) {
          console.error('Error fetching discount info:', error);
        }
      }

      // Calculate actual discount amount from bill total vs items total
      const itemsTotal = detailedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const actualDiscountAmount = Math.max(0, itemsTotal - bill.totalAmount);

      const updatedBill = {
        ...bill,
        items: detailedItems,
        serviceDetails: serviceDetails, // Add fetched service details
        discountInfo: discountInfo,
        // Use calculated discount amount or from discount info
        giaTriGiam: actualDiscountAmount > 0 ? actualDiscountAmount : (discountInfo?.giaTriGiam || 0)
      };

      setViewBill(updatedBill);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error preparing bill details:', error);
      setViewBill(bill);
      setIsModalVisible(true);
    }
  };

  // Handle print bill
  const handlePrint = (bill: any) => {
    message.success('Đang in hóa đơn ' + bill.billNumber);
  };

  // Calculate total with services and discount
  const calculateTotalAmount = () => {
    let total = 0;

    // Add room amount from bill calculation
    if (billCalculation) {
      total += billCalculation.tienPhong + billCalculation.tienDichVu;
    }

    // Add selected services
    selectedServices.forEach(service => {
      total += (service.quantity || 1) * (service.price || 0);
    });

    // Apply discount
    if (selectedDiscount) {
      const discount = discounts.find(d => d.maGiam === selectedDiscount);
      if (discount) {
        total = Math.max(0, total - (discount.giaTriGiam || 0));
      }
    }

    return total;
  };

  // Handle service selection
  const handleAddService = () => {
    const newService = {
      id: Date.now(),
      serviceId: null,
      quantity: 1,
      price: 0
    };
    setSelectedServices([...selectedServices, newService]);
  };

  // Handle service removal
  const handleRemoveService = (serviceId: number) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  // Handle service change
  const handleServiceChange = (serviceId: number, field: string, value: any) => {
    setSelectedServices(selectedServices.map(service => {
      if (service.id === serviceId) {
        const updatedService = { ...service, [field]: value };

        // Auto-fill price when service is selected
        if (field === 'serviceId') {
          const selectedService = services.find(s => s.maDichVu === value);
          if (selectedService) {
            updatedService.price = selectedService.gia || 0;
          }
        }

        return updatedService;
      }
      return service;
    }));
  };

  // Handle customer select for bill calculation
  const handleCustomerSelect = async (customerId: number) => {
    setSelectedCustomerForBill(customerId);
    setCalculationLoading(true);

    try {
      const calculation = await calculateBill(customerId);
      setBillCalculation(calculation);

      if (calculation) {
        form.setFieldsValue({
          customerId: customerId,
          totalAmount: calculation.tongTien,
          roomAmount: calculation.tienPhong,
          serviceAmount: calculation.tienDichVu
        });

        const discountText = calculation.giaTriGiam > 0 ? ` - Giảm giá ${calculation.giaTriGiam.toLocaleString('vi-VN')}đ` : '';
        message.success(`Đã tính toán hóa đơn: Phòng ${calculation.tienPhong.toLocaleString('vi-VN')}đ + Dịch vụ ${calculation.tienDichVu.toLocaleString('vi-VN')}đ${discountText} = ${calculation.tongTien.toLocaleString('vi-VN')}đ`);
      } else {
        message.warning('Không tìm thấy thông tin đặt phòng hoặc sử dụng dịch vụ cho khách hàng này');
        setBillCalculation(null);
      }
    } catch (error: any) {
      console.error('Full error in handleCustomerSelect:', error);
      message.error(`Lỗi khi tính toán hóa đơn: ${error.message || 'Vui lòng thử lại sau.'}`);
      setBillCalculation(null);
    } finally {
      setCalculationLoading(false);
    }
  };

  // Handle add new bill
  const handleAddBill = () => {
    form.validateFields().then(async (values) => {
      try {
        const { customerId, paymentMethod } = values;

        // Calculate total amount using our new logic
        const totalAmount = calculateTotalAmount();

        if (totalAmount <= 0) {
          message.error('Tổng tiền hóa đơn phải lớn hơn 0');
          return;
        }

        // Use selected discount
        const discount = selectedDiscount || 1;

        const newBillData = {
          maKH: customerId,
          ngayLapHD: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'),
          maPhuongThuc: paymentMethod,
          tongTien: totalAmount,
          maGiam: discount || 1,
          trangThai: 2
        };

        try {
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

          const billResult = await billResponse.json();
          let newBillId = billResult.maHD || billResult.id;

          // If no bill ID returned, try to find the latest bill
          if (!newBillId) {
            console.log('No bill ID returned, trying to find latest bill...');

            // Wait a moment for the bill to be saved
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
              const allBillsResponse = await fetch(`${BASE_URL}/HoaDon/GetAll`);
              if (allBillsResponse.ok) {
                const allBillsData = await allBillsResponse.json();
                const allBills = allBillsData.items || allBillsData.value || allBillsData || [];

                if (allBills.length > 0) {
                  // Find bills matching our criteria
                  const matchingBills = allBills.filter((bill: any) =>
                    bill.maKH === customerId &&
                    bill.maPhuongThuc === paymentMethod &&
                    bill.tongTien === totalAmount &&
                    bill.maGiam === discount &&
                    bill.trangThai === 2
                  );

                  if (matchingBills.length > 0) {
                    // Get the latest bill (highest ID)
                    const latestBill = matchingBills.reduce((prev: any, current: any) =>
                      (current.maHD || current.id) > (prev.maHD || prev.id) ? current : prev
                    );
                    newBillId = latestBill.maHD || latestBill.id;
                    console.log('Found latest bill ID:', newBillId);
                  }
                }
              }
            } catch (fetchError) {
              console.error('Error fetching latest bill:', fetchError);
            }
          }

          // Create service usage records for selected services
          if (selectedServices && selectedServices.length > 0 && selectedCustomerForBill) {
            for (const service of selectedServices) {
              if (service.serviceId && service.quantity && service.price) {
                // 1. Create service usage record
                const serviceUsageData = {
                  maKH: selectedCustomerForBill,
                  maDV: service.serviceId,
                  ngaySD: new Date().toISOString(),
                  soLuong: service.quantity,
                  thanhTien: service.quantity * service.price,
                  trangThai: 'Đã đặt',
                  xoa: false
                };

                try {
                  const serviceUsageResponse = await fetch(`${BASE_URL}/SuDungDichVu/Create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(serviceUsageData)
                  });

                  if (serviceUsageResponse.ok) {
                    console.log('Service usage created successfully for service:', service.serviceId);
                  }
                } catch (serviceError) {
                  console.error('Error creating service usage:', serviceError);
                }

                // 2. Create service detail for bill (if we have bill ID)
                if (newBillId) {
                  const serviceDetailData = {
                    maHD: newBillId,
                    maDichVu: service.serviceId,
                    soLuong: service.quantity,
                    donGia: service.price,
                    thanhTien: service.quantity * service.price
                  };

                  try {
                    const serviceDetailResponse = await fetch(`${BASE_URL}/ChiTietHoaDonDV/Create`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(serviceDetailData)
                    });

                    if (serviceDetailResponse.ok) {
                      console.log('Service detail created successfully for bill:', newBillId, 'service:', service.serviceId);
                    } else {
                      console.error('Failed to create service detail:', await serviceDetailResponse.text());
                    }
                  } catch (serviceError) {
                    console.error('Error creating service detail:', serviceError);
                  }
                } else {
                  console.warn('No bill ID available, cannot create service detail for service:', service.serviceId);
                }
              }
            }
          }

          // Show success message with details
          const serviceCount = selectedServices.length;
          let successMessage = 'Tạo hóa đơn thành công!';

          if (serviceCount > 0) {
            successMessage += ` Đã thêm ${serviceCount} dịch vụ vào hóa đơn.`;
            if (newBillId) {
              successMessage += ` Mã hóa đơn: ${newBillId}`;
            }
          }

          message.success(successMessage);
          setIsNewBillModalVisible(false);
          form.resetFields();
          setBillCalculation(null);
          setSelectedCustomerForBill(null);
          setSelectedServices([]);
          setSelectedDiscount(null);
          fetchBills();

        } catch (error: any) {
          throw new Error(`Không thể tạo hóa đơn: ${error.message}`);
        }

      } catch (error: any) {
        message.error(`Lỗi khi tạo hóa đơn: ${error.message || 'Vui lòng thử lại sau.'}`);
      }
    }).catch(() => {
      message.error('Vui lòng kiểm tra lại thông tin đã nhập');
    });
  };

  // Handle payment
  const handlePayment = (bill: any) => {
    if (!bill) {
      message.error('Không tìm thấy thông tin hóa đơn');
      return;
    }

    const maHD = bill.maHD || bill.id;
    if (!maHD) {
      message.error('Không tìm thấy mã hóa đơn');
      return;
    }

    setBillToPayment(bill);
    setIsPaymentModalVisible(true);
  };

  // Handle confirm payment
  const handleConfirmPayment = async () => {
    if (!billToPayment) return;
    setIsPaymentModalVisible(false);

    try {
      const maHD = billToPayment.maHD || billToPayment.id;
      if (!maHD) {
        throw new Error('Không tìm thấy mã hóa đơn. Vui lòng làm mới trang và thử lại.');
      }

      const updatedBills = bills.map(bill => {
        const currentBillId = bill.maHD || bill.id;
        if (currentBillId === maHD) {
          return {
            ...bill,
            status: 'paid',
            trangThai: 1,
            trangThaiThanhToan: 1,
            trangThaiThanhToanName: 'Đã Thanh Toán'
          };
        }
        return bill;
      });

      setBills(updatedBills);
      message.success(`Đã xác nhận thanh toán hóa đơn ${billToPayment.billNumber}`);

      if (viewBill && (viewBill.maHD === maHD || viewBill.id === maHD)) {
        const updatedViewBill = {
          ...viewBill,
          status: 'paid',
          trangThai: 1,
          trangThaiThanhToan: 1,
          trangThaiThanhToanName: 'Đã Thanh Toán'
        };
        setViewBill(updatedViewBill);
        setIsModalVisible(true);
      }

      setBillToPayment(null);

    } catch (error: any) {
      message.error(`Không thể xác nhận thanh toán. ${error.message || 'Vui lòng thử lại sau.'}`);
    }
  };

  // Filter bills based on status and search
  const filteredBills = bills.filter(bill => {
    const matchesStatus = statusFilter ? bill.status === statusFilter : true;
    const matchesSearch = searchText
      ? bill.billNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        bill.customerName.toLowerCase().includes(searchText.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  // Define columns for bills table
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

        switch(record.maPhuongThuc) {
          case 2:
            color = '#D82D8B';
            icon = 'Momo';
            break;
          case 3:
            color = 'blue';
            icon = 'Ngân Hàng';
            break;
          case 4:
            color = 'green';
            icon = 'Tiền mặt';
            break;
          case 5:
            color = 'gold';
            icon = 'Thẻ Tín Dụng';
            break;
          default:
            color = 'default';
            icon = 'Không xác định';
        }

        return (
          <Tag color={color}>
            {text || icon || 'Không xác định'}
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

        if (record.trangThaiThanhToanName && record.trangThaiThanhToanName !== 'Không xác định') {
          return (
            <Tag color={statusColor}>
              {record.trangThaiThanhToanName}
            </Tag>
          );
        }

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
            </>
          )}

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

  // Define columns for bill items table
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
                    <Tag color="blue">
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
                  const subtotal = viewBill.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
                  const discountAmount = viewBill.giaTriGiam || 0;
                  const hasDiscount = discountAmount > 0;

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3} align="right">
                          <strong>Tạm tính:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <strong>{subtotal.toLocaleString('vi-VN')} VNĐ</strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>

                      {hasDiscount ? (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3} align="right">
                            <strong>Giảm giá:</strong>
                            {viewBill.discountInfo && (
                              <div style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>
                                ({viewBill.discountInfo.tenGG})
                              </div>
                            )}
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
                          <strong style={{ color: '#1890ff', fontSize: '16px' }}>
                            {viewBill.totalAmount.toLocaleString('vi-VN')} VNĐ
                          </strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </div>

            {/* Service Details Section */}
            <Divider />
            <div>
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
                      title: 'Tên dịch vụ',
                      dataIndex: 'tenDichVu',
                      key: 'tenDichVu',
                      render: (text, record) => (
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {text || record.dichVu?.ten || `Dịch vụ ${record.maDichVu}`}
                          </div>
                          {record.moTaDichVu && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {record.moTaDichVu}
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Số lượng',
                      dataIndex: 'soLuong',
                      key: 'soLuong',
                      align: 'center',
                      width: 100,
                    },
                    {
                      title: 'Đơn giá',
                      dataIndex: 'donGia',
                      key: 'donGia',
                      align: 'right',
                      width: 120,
                      render: (price) => `${price?.toLocaleString('vi-VN') || 0} VNĐ`,
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'thanhTien',
                      key: 'thanhTien',
                      align: 'right',
                      width: 120,
                      render: (amount) => (
                        <span style={{ fontWeight: 500, color: '#1890ff' }}>
                          {amount?.toLocaleString('vi-VN') || 0} VNĐ
                        </span>
                      ),
                    },
                  ]}
                  dataSource={viewBill.serviceDetails}
                  rowKey={(record) => record.maChiTiet || record.maDichVu || Math.random()}
                  pagination={false}
                  locale={{ emptyText: 'Không có dịch vụ nào' }}
                  size="small"
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
        )}
      </Modal>

      {/* Modal xác nhận thanh toán */}
      <Modal
        title="Xác nhận thanh toán"
        open={isPaymentModalVisible}
        onOk={handleConfirmPayment}
        onCancel={() => setIsPaymentModalVisible(false)}
        okText="Xác nhận thanh toán"
        cancelText="Hủy"
        okType="primary"
      >
        {billToPayment && (
          <div>
            <p><strong>Mã hóa đơn:</strong> {billToPayment.billNumber}</p>
            <p><strong>Khách hàng:</strong> {billToPayment.customerName}</p>
            <p><strong>Tổng tiền:</strong> {billToPayment.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
            <p><strong>Phương thức thanh toán:</strong> {billToPayment.paymentMethodName}</p>
            <Alert
              message="Xác nhận thanh toán"
              description="Bạn có chắc chắn muốn xác nhận thanh toán cho hóa đơn này?"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
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
          setBillCalculation(null);
          setSelectedCustomerForBill(null);
          setSelectedServices([]);
          setSelectedDiscount(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsNewBillModalVisible(false);
            form.resetFields();
            setBillCalculation(null);
            setSelectedCustomerForBill(null);
            setSelectedServices([]);
            setSelectedDiscount(null);
          }}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleAddBill}>
            Tạo hóa đơn
          </Button>
        ]}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="Khách hàng"
                rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
              >
                <Select
                  placeholder="Chọn khách hàng"
                  showSearch
                  filterOption={false}
                  onSearch={handleCustomerSearch}
                  onChange={handleCustomerSelect}
                  loading={customerDataLoading || isSearching}
                  notFoundContent={
                    customerDataLoading || isSearching ?
                      <Spin size="small" /> :
                      customerPagination.totalItems > 0 ?
                        `Không tìm thấy khách hàng (${customerPagination.totalItems} khách hàng có sẵn)` :
                        'Không tìm thấy khách hàng'
                  }
                >
                  {getDisplayCustomers().map(customer => (
                    <Option key={customer.maKH} value={customer.maKH}>
                      {customer.tenKH} - {customer.phone}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
              >
                <Select placeholder="Chọn phương thức thanh toán">
                  {paymentMethods.map(method => (
                    <Option key={method.id} value={method.id}>
                      {method.tenPhuongThuc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Additional Services Section */}
          <Divider>Dịch vụ bổ sung</Divider>
          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" onClick={handleAddService} style={{ width: '100%' }}>
              + Thêm dịch vụ
            </Button>
          </div>

          {selectedServices.map((service) => (
            <Row key={service.id} gutter={16} style={{ marginBottom: 8 }}>
              <Col span={8}>
                <Select
                  placeholder="Chọn dịch vụ"
                  value={service.serviceId}
                  onChange={(value) => handleServiceChange(service.id, 'serviceId', value)}
                  style={{ width: '100%' }}
                >
                  {services.map(s => (
                    <Option key={s.maDichVu} value={s.maDichVu}>
                      {s.ten} - {s.gia?.toLocaleString('vi-VN')} VNĐ
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <InputNumber
                  placeholder="SL"
                  min={1}
                  value={service.quantity}
                  onChange={(value) => handleServiceChange(service.id, 'quantity', value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <InputNumber
                  placeholder="Đơn giá"
                  value={service.price}
                  onChange={(value) => handleServiceChange(service.id, 'price', value)}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={4}>
                <span style={{ lineHeight: '32px' }}>
                  {((service.quantity || 1) * (service.price || 0)).toLocaleString('vi-VN')} VNĐ
                </span>
              </Col>
              <Col span={2}>
                <Button
                  type="text"
                  danger
                  onClick={() => handleRemoveService(service.id)}
                  icon={<DeleteOutlined />}
                />
              </Col>
            </Row>
          ))}

          {/* Discount Section */}
          <Divider>Giảm giá</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="discount"
                label="Mã giảm giá"
              >
                <Select
                  placeholder="Chọn mã giảm giá (tùy chọn)"
                  allowClear
                  value={selectedDiscount}
                  onChange={setSelectedDiscount}
                >
                  {discounts.map(discount => (
                    <Option key={discount.maGiam} value={discount.maGiam}>
                      {discount.tenGG} - Giảm {discount.giaTriGiam?.toLocaleString('vi-VN')} VNĐ
                      {discount.ngayKetThuc && (
                        <span style={{ color: '#888', fontSize: '12px' }}>
                          {' '}(HSD: {dayjs(discount.ngayKetThuc).format('DD/MM/YYYY')})
                        </span>
                      )}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Total Calculation Display */}
          {(billCalculation || selectedServices.length > 0 || selectedDiscount) && (
            <Alert
              message="Tổng tiền hóa đơn"
              description={
                <div>
                  {billCalculation && (
                    <>
                      <p>Tiền phòng: {billCalculation.tienPhong.toLocaleString('vi-VN')} VNĐ ({billCalculation.soNgay} ngày × {billCalculation.giaPhongMoiNgay.toLocaleString('vi-VN')} VNĐ)</p>
                      <p>Dịch vụ có sẵn: {billCalculation.tienDichVu.toLocaleString('vi-VN')} VNĐ ({billCalculation.chiTietDichVu.length} dịch vụ)</p>
                    </>
                  )}
                  {selectedServices.length > 0 && (
                    <p>Dịch vụ bổ sung: {selectedServices.reduce((total, service) => total + ((service.quantity || 1) * (service.price || 0)), 0).toLocaleString('vi-VN')} VNĐ ({selectedServices.length} dịch vụ)</p>
                  )}
                  {selectedDiscount && (
                    <p style={{ color: '#52c41a' }}>
                      Giảm giá: -{discounts.find(d => d.maGiam === selectedDiscount)?.giaTriGiam?.toLocaleString('vi-VN') || 0} VNĐ
                    </p>
                  )}
                  <Divider style={{ margin: '8px 0' }} />
                  <p><strong>Tổng cộng: {calculateTotalAmount().toLocaleString('vi-VN')} VNĐ</strong></p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {calculationLoading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <p style={{ marginTop: 8 }}>Đang tính toán hóa đơn...</p>
            </div>
          )}

          {selectedCustomerForBill && !billCalculation && !calculationLoading && (
            <Alert
              message="Không tìm thấy thông tin"
              description="Không tìm thấy thông tin đặt phòng hoặc sử dụng dịch vụ cho khách hàng này"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default BillManagement;
