import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, Card, Statistic, Row, Col, Avatar, Tabs, message, Select, Form, Switch } from 'antd';
import { EyeOutlined, UserOutlined, HistoryOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAllCustomers, PaginatedCustomerResponse } from '../../../services/customerService';
import dayjs from 'dayjs';
import axios from 'axios';
import NoPermissionModal from '../../shared/NoPermissionModal';

const { TabPane } = Tabs;
const { Option } = Select;

// API URLs với fallback - sử dụng proxy Next.js
const CUSTOMER_API_URLS = [
  '/api/KhachHang/GetAll', // Proxy từ Next.js config (ưu tiên)
  'https://ptud-web-1.onrender.com/api/KhachHang/GetAll', // Gọi API trực tiếp (phòng khi proxy không hoạt động)
  'https://ptud-web-3.onrender.com/api/KhachHang/GetAll', // Thử endpoint thay thế
];

// API URLs cho lịch sử đặt phòng - sử dụng proxy Next.js
const BOOKING_HISTORY_API_URLS = [
  '/api/DatPhong/GetByUser', // Proxy từ Next.js config (ưu tiên)
  'https://ptud-web-1.onrender.com/api/DatPhong/GetByUser', // Gọi API trực tiếp (phòng khi proxy không hoạt động)
  'https://ptud-web-3.onrender.com/api/DatPhong/GetByUser', // Thử endpoint thay thế
];

// API URLs cho API hóa đơn
const INVOICE_API_URLS = [
  '/api/HoaDon/GetAll', // Proxy từ Next.js config (ưu tiên)
  'https://ptud-web-1.onrender.com/api/HoaDon/GetAll', // Gọi API trực tiếp (phòng khi proxy không hoạt động)
];

// Dữ liệu mẫu khách hàng khi API fail
const MOCK_CUSTOMERS = {
  "items": [
    {
      "maKH": 1,
      "vaiTro": null,
      "datPhongs": null,
      "hoaDons": null,
      "suDungDichVus": null,
      "tenKH": "update1",
      "email": "update1",
      "phone": null,
      "maVaiTro": null,
      "xoa": true
    },
    {
      "maKH": 2,
      "vaiTro": null,
      "datPhongs": null,
      "hoaDons": null,
      "suDungDichVus": null,
      "tenKH": "KH2",
      "email": "KH2",
      "phone": "0123",
      "maVaiTro": null,
      "xoa": false
    }
  ]
};

// Dữ liệu mẫu lịch sử đặt phòng
const MOCK_BOOKING_HISTORY = [
  {
    maDatPhong: 1,
    trangThaiDatPhong: null,
    khachHang: null,
    phong: null,
    maKH: null,
    maPhong: null,
    ngayDat: "2023-05-13T08:03:42.49",
    checkIn: null,
    checkOut: null,
    trangThai: 3,
    xoa: true
  },
  {
    maDatPhong: 2,
    trangThaiDatPhong: null,
    khachHang: null,
    phong: null,
    maKH: null,
    maPhong: null,
    ngayDat: "2023-05-13T08:06:04.69",
    checkIn: null,
    checkOut: null,
    trangThai: 3,
    xoa: false
  }
];

// Interface định nghĩa cấu trúc dữ liệu khách hàng
interface Customer {
  maKH: number;
  tenKH: string;
  email: string;
  phone: string | null;
  xoa: boolean;
}

// Interface định nghĩa cấu trúc dữ liệu lịch sử đặt phòng
interface BookingHistory {
  maDatPhong: number;
  ngayDat: string;
  checkIn: string | null;
  checkOut: string | null;
  maPhong: number | null;
  trangThai: number;
  maKH: number | null;
  xoa: boolean;
}

// Interface định nghĩa cấu trúc dữ liệu hóa đơn
interface Invoice {
  maHD: number;
  khachHang: any;
  trangThaiThanhToan: any;
  phuongThucThanhToan: any;
  giaGiam: any;
  chiTietHoaDonDVs: any;
  maKH: number;
  ngayLapHD: string;
  maPhuongThuc: number;
  maGiam: number;
  tongTien: number;
  trangThai: number;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm] = Form.useForm();
  const [updatingCustomer, setUpdatingCustomer] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Permission modal states
  const [noPermissionModal, setNoPermissionModal] = useState({
    visible: false,
    action: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} của ${total} khách hàng`,
  });

  useEffect(() => {
    fetchCustomers(pagination.current, pagination.pageSize);
  }, []);

  // Handle table pagination change
  const handleTableChange = (page: number, pageSize?: number) => {
    const newPagination = {
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize,
    };
    setPagination(newPagination);
    fetchCustomers(page, pageSize || pagination.pageSize);
  };

  // Format dữ liệu khách hàng từ API response
  const formatCustomerData = (data: any[]): Customer[] => {
    return data.map((customer: any) => ({
      maKH: customer.maKH || 0,
      tenKH: customer.tenKH || '',
      email: customer.email || '',
      phone: customer.phone || null,
      xoa: customer.xoa || false
    }));
  };

  // Fetch khách hàng từ API với phân trang
  const fetchCustomers = async (pageNumber: number = 1, pageSize: number = 10) => {
    setLoading(true);
    setError('');
    // 1. Thử sử dụng service mới với pagination
    try {
      const response = await getAllCustomers(pageNumber, pageSize);

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedCustomerResponse;

        // Format customer data
        const formattedCustomers = formatCustomerData(paginatedData.items);

        // Update customers and pagination info
        setCustomers(formattedCustomers);
        setPagination(prev => ({
          ...prev,
          current: paginatedData.pageNumber,
          pageSize: paginatedData.pageSize,
          total: paginatedData.totalItems,
        }));
        message.success('Tải dữ liệu khách hàng thành công');
        setLoading(false);
        return; // Thành công, thoát khỏi hàm
      } else {
        throw new Error(response.message || 'Failed to fetch customers');
      }
    } catch (serviceErr) {
      // Tiếp tục với phương thức fallback
    }

    // 2. Fallback: Thử sử dụng fetch API với proxy Next.js (ưu tiên nhất)
    try {
      const response = await fetch('/api/KhachHang/GetAll');
      const data = await response.json();
      if (data && data.items && Array.isArray(data.items)) {
        setCustomers(data.items);
        // Update pagination for fallback (client-side pagination)
        setPagination(prev => ({
          ...prev,
          total: data.items.length,
        }));
        message.success('Tải dữ liệu khách hàng thành công');
        setLoading(false);
        return; // Thành công, thoát khỏi hàm
      }
    } catch (fetchErr) {
      // Tiếp tục với phương thức khác
    }

    // 2. Thử từng API endpoint với Axios
    for (let i = 0; i < CUSTOMER_API_URLS.length; i++) {
      try {
        const response = await axios.get(CUSTOMER_API_URLS[i], {
          timeout: 10000, // 10 giây timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        // Xử lý các định dạng response khác nhau
        if (response.data) {
          let formattedCustomers: Customer[] = [];

          if (response.data.items && Array.isArray(response.data.items)) {
            formattedCustomers = formatCustomerData(response.data.items);
          } else if (Array.isArray(response.data)) {
            formattedCustomers = formatCustomerData(response.data);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            formattedCustomers = formatCustomerData(response.data.data);
          }

          if (formattedCustomers.length > 0) {
            setCustomers(formattedCustomers);
            message.success('Tải dữ liệu khách hàng thành công');
            setLoading(false);
            return; // Thành công, thoát khỏi hàm
          }
        }

        // Nếu đến đây, định dạng response không được nhận dạng
      } catch (axiosErr) {
        // Tiếp tục thử API endpoint tiếp theo
      }
    }

    // 3. Trường hợp cuối cùng, thử dùng XMLHttpRequest
    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (parseErr) {
              reject(new Error('Error parsing response'));
            }
          } else {
            reject(new Error(`HTTP error: ${xhr.status}`));
          }
        };
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        xhr.open('GET', '/api/KhachHang/GetAll');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 10000; // 10 giây timeout
        xhr.send();
      });

      if (data && data.items && Array.isArray(data.items)) {
        setCustomers(data.items);
        message.success('Tải dữ liệu khách hàng thành công');
        setLoading(false);
        return; // Thành công, thoát khỏi hàm
      }
    } catch (xhrErr) {
    }

    // 4. Nếu tất cả phương thức đều thất bại, sử dụng dữ liệu mẫu
    setCustomers(MOCK_CUSTOMERS.items as Customer[]);
    // Update pagination for mock data
    setPagination(prev => ({
      ...prev,
      total: MOCK_CUSTOMERS.items.length,
    }));
    message.warning('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
    setError('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
    setLoading(false);
  };

  // Format dữ liệu lịch sử đặt phòng từ API
  const formatBookingHistoryData = (data: any[]): BookingHistory[] => {
    return data.map((booking: any) => ({
      maDatPhong: booking.maDatPhong || 0,
      ngayDat: booking.ngayDat || '',
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      maPhong: booking.maPhong,
      trangThai: booking.trangThai || 0,
      maKH: booking.maKH,
      xoa: booking.xoa || false
    }));
  };

  // Fetch lịch sử đặt phòng của khách hàng với cơ chế fallback
  const fetchCustomerBookingHistory = async (customerId: number) => {
    setLoadingHistory(true);
    try {
      // Thử sử dụng API đặt phòng
      const response = await fetch('/api/DatPhong/GetAll');
      const data = await response.json();

      if (data && data.items && Array.isArray(data.items)) {
        // Thông báo không có lịch sử đặt phòng hợp lệ
        setBookingHistory([]);
        message.info('Không tìm thấy lịch sử đặt phòng cho khách hàng này');
        setLoadingHistory(false);
        return;
      }
    } catch (err) {
    }

    // Nếu không lấy được dữ liệu, hiển thị thông báo không có lịch sử
    setBookingHistory([]);
    message.info('Không tìm thấy lịch sử đặt phòng cho khách hàng này');
    setLoadingHistory(false);
  };

  // Format dữ liệu hóa đơn từ API
  const formatInvoiceData = (data: any[]): Invoice[] => {
    return data.map((invoice: any) => ({
      maHD: invoice.maHD || 0,
      khachHang: invoice.khachHang,
      trangThaiThanhToan: invoice.trangThaiThanhToan,
      phuongThucThanhToan: invoice.phuongThucThanhToan,
      giaGiam: invoice.giaGiam,
      chiTietHoaDonDVs: invoice.chiTietHoaDonDVs,
      maKH: invoice.maKH || 0,
      ngayLapHD: invoice.ngayLapHD || '',
      maPhuongThuc: invoice.maPhuongThuc || 0,
      maGiam: invoice.maGiam || 0,
      tongTien: invoice.tongTien || 0,
      trangThai: invoice.trangThai || 0
    }));
  };

  // Fetch hóa đơn của khách hàng
  const fetchCustomerInvoices = async (customerId: number) => {
    setLoadingInvoice(true);
    try {
      // Thử sử dụng API hóa đơn
      const response = await fetch('/api/HoaDon/GetAll');
      const data = await response.json();

      if (data && data.length > 0) {
        // Kiểm tra cấu trúc dữ liệu
        const formattedInvoices = formatInvoiceData(data);

        // Lọc hóa đơn theo maKH
        const customerInvoices = formattedInvoices.filter(invoice => invoice.maKH === customerId);

        if (customerInvoices.length > 0) {
          setInvoices(customerInvoices);
          message.success(`Tìm thấy ${customerInvoices.length} hóa đơn của khách hàng`);
        } else {
          setInvoices([]);
          message.info('Không tìm thấy hóa đơn cho khách hàng này');
        }
      } else {
        setInvoices([]);
        message.info('Không tìm thấy hóa đơn cho khách hàng này');
      }
    } catch (err) {
      setInvoices([]);
      message.error('Không thể tải dữ liệu hóa đơn từ máy chủ');
    } finally {
      setLoadingInvoice(false);
    }
  };

  // Xử lý xem chi tiết khách hàng
  const handleView = (customer: Customer) => {
    setViewCustomer(customer);
    setIsModalVisible(true);
    fetchCustomerBookingHistory(customer.maKH);
    fetchCustomerInvoices(customer.maKH);
  };

  // Xử lý tìm kiếm
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Xử lý lọc theo trạng thái
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Làm mới dữ liệu
  const handleRefresh = () => {
    fetchCustomers(pagination.current, pagination.pageSize);
    message.info('Đang làm mới dữ liệu...');
  };

  // Lọc danh sách khách hàng
  const filteredCustomers = customers.filter(customer => {
    // Ẩn các khách hàng có xoa = true khỏi giao diện
    if (customer.xoa === true) {
      return false;
    }

    const matchesSearch =
      (customer.tenKH && customer.tenKH.toLowerCase().includes(searchText.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchText)) ||
      (customer.email && customer.email.toLowerCase().includes(searchText.toLowerCase()));

    const matchesStatus = statusFilter ?
      (statusFilter === 'active' ? !customer.xoa : statusFilter === 'inactive' ? customer.xoa : true)
      : true;

    return matchesSearch && matchesStatus;
  });

  // Định nghĩa các cột cho bảng khách hàng
  const columns: ColumnsType<Customer> = [
    {
      title: 'Mã KH',
      dataIndex: 'maKH',
      key: 'maKH',
      sorter: (a: Customer, b: Customer) => a.maKH - b.maKH,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'tenKH',
      key: 'tenKH',
      render: (tenKH: string, record: Customer) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{tenKH || 'Chưa cập nhật'}</div>
          </div>
        </Space>
      ),
      sorter: (a: Customer, b: Customer) => (a.tenKH || '').localeCompare(b.tenKH || ''),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || 'Chưa cập nhật',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) => phone || 'Chưa cập nhật',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'xoa',
      key: 'xoa',
      render: (xoa: boolean) => {
        return <Tag color={xoa ? 'red' : 'green'}>{xoa ? 'Đã xóa' : 'Hoạt động'}</Tag>;
      },
      filters: [
        { text: 'Hoạt động', value: false },
        { text: 'Đã xóa', value: true },
      ],
      onFilter: (value, record) => {
        // Convert value to boolean for comparison
        const boolValue = value === true || value === 'true';
        return record.xoa === boolValue;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            type="primary"
            size="small"
          >
            Xem
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            type="default"
            size="small"
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              handleDeleteCustomer(record);
            }}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Định nghĩa các cột cho bảng lịch sử đặt phòng
  const bookingColumns: ColumnsType<BookingHistory> = [
    {
      title: 'Mã đặt phòng',
      dataIndex: 'maDatPhong',
      key: 'maDatPhong',
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'ngayDat',
      key: 'ngayDat',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Ngày nhận phòng',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa xác định',
    },
    {
      title: 'Ngày trả phòng',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa xác định',
    },
    {
      title: 'Mã phòng',
      dataIndex: 'maPhong',
      key: 'maPhong',
      render: (maPhong) => maPhong || 'Chưa xác định',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai) => {
        let color = '';
        let text = '';

        switch(trangThai) {
          case 1:
            color = 'green';
            text = 'Đã xác nhận';
            break;
          case 2:
            color = 'geekblue';
            text = 'Đang xử lý';
            break;
          case 3:
            color = 'volcano';
            text = 'Đã hoàn thành';
            break;
          default:
            text = `Trạng thái ${trangThai}`;
            color = 'default';
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  // Định nghĩa các cột cho bảng hóa đơn
  const invoiceColumns: ColumnsType<Invoice> = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'maHD',
      key: 'maHD',
    },
    {
      title: 'Ngày lập',
      dataIndex: 'ngayLapHD',
      key: 'ngayLapHD',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Phương thức',
      dataIndex: 'maPhuongThuc',
      key: 'maPhuongThuc',
      render: (method) => {
        switch(method) {
          case 1: return 'Tiền mặt';
          case 2: return 'Chuyển khoản';
          default: return `Phương thức ${method}`;
        }
      },
    },
    {
      title: 'Mã giảm',
      dataIndex: 'maGiam',
      key: 'maGiam',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongTien',
      key: 'tongTien',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai) => {
        switch(trangThai) {
          case 1: return <Tag color="green">Đã thanh toán</Tag>;
          case 0: return <Tag color="orange">Chưa thanh toán</Tag>;
          default: return <Tag color="default">{`Trạng thái ${trangThai}`}</Tag>;
        }
      },
    },
  ];

  // Hiển thị modal tạo khách hàng mới
  const showCreateModal = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
  };

  // Đóng modal tạo khách hàng
  const handleCreateCancel = () => {
    setIsCreateModalVisible(false);
  };

  // Xử lý tạo khách hàng mới
  const handleCreateCustomer = async (values: any) => {
    setCreatingCustomer(true);
    try {
      // Chuẩn bị dữ liệu gửi lên API
      const customerData = {
        tenKH: values.tenKH,
        email: values.email,
        phone: values.phone,
        maVaiTro: values.maVaiTro || 0,
        xoa: false
      };
      // Gọi API tạo khách hàng
      const response = await fetch('/api/KhachHang/Create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        message.success('Tạo khách hàng mới thành công');
        setIsCreateModalVisible(false);
        fetchCustomers(pagination.current, pagination.pageSize); // Tải lại danh sách khách hàng
      } else {
        const errorData = await response.json();
        message.error(`Tạo khách hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      message.error('Không thể tạo khách hàng mới. Vui lòng thử lại sau.');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Hiển thị modal cập nhật khách hàng - Staff không có quyền
  const showEditModal = (customer: Customer) => {
    setNoPermissionModal({
      visible: true,
      action: 'chỉnh sửa thông tin khách hàng'
    });
  };

  // Đóng modal cập nhật khách hàng
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingCustomer(null);
  };

  // Xử lý cập nhật khách hàng
  const handleUpdateCustomer = async (values: any) => {
    if (!editingCustomer) return;

    setUpdatingCustomer(true);
    try {
      // Chuẩn bị dữ liệu gửi lên API theo đúng cấu trúc của API HoaDon/Update
      const customerData = {
        maKH: editingCustomer.maKH,
        ngayLapHD: new Date().toISOString(),
        maPhuongThuc: 0,
        maGiam: 0,
        tongTien: 0,
        trangThai: 0
      };
      // Gọi API cập nhật khách hàng
      const response = await fetch(`/api/KhachHang/Update?id=${editingCustomer.maKH}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        message.success('Cập nhật khách hàng thành công');
        setIsEditModalVisible(false);
        setEditingCustomer(null);
        fetchCustomers(pagination.current, pagination.pageSize); // Tải lại danh sách khách hàng
      } else {
        const errorData = await response.json();
        message.error(`Cập nhật khách hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      message.error('Không thể cập nhật thông tin khách hàng. Vui lòng thử lại sau.');
    } finally {
      setUpdatingCustomer(false);
    }
  };

  // Xử lý xóa khách hàng - Staff không có quyền
  const handleDeleteCustomer = (customer: Customer) => {
    setNoPermissionModal({
      visible: true,
      action: 'xóa khách hàng'
    });
  };

  // Xử lý hủy xóa khách hàng
  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setCustomerToDelete(null);
  };

  // Xử lý xác nhận xóa khách hàng
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/KhachHang/Delete?id=${customerToDelete.maKH}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xoa: true }),
      });

      if (response.ok) {
        message.success('Xóa khách hàng thành công');
        fetchCustomers(pagination.current, pagination.pageSize); // Tải lại danh sách khách hàng
        setIsDeleteModalVisible(false);
        setCustomerToDelete(null);
      } else {
        const errorData = await response.json();
        message.error(`Xóa khách hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      message.error('Không thể xóa khách hàng. Vui lòng thử lại sau.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Quản lý khách hàng</h2>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            Thêm khách hàng
          </Button>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <Tag color="red">{error}</Tag>
        </div>
      )}

      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Tổng số khách hàng"
              value={pagination.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Khách hàng hoạt động (trang hiện tại)"
              value={customers.filter(c => !c.xoa).length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tìm kiếm và lọc */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="Tìm kiếm khách hàng theo tên, email, số điện thoại"
          style={{ width: 400 }}
          onSearch={handleSearch}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 200 }}
          onChange={handleStatusFilterChange}
          allowClear
        >
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Đã xóa</Option>
        </Select>
      </div>

      {/* Bảng khách hàng */}
      <Table
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="maKH"
        pagination={{
          ...pagination,
          onChange: handleTableChange,
          onShowSizeChange: handleTableChange,
        }}
        loading={loading}
      />

      {/* Modal xem chi tiết khách hàng */}
      <Modal
        title="Chi tiết khách hàng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {viewCustomer && (
          <>
            <div style={{ display: 'flex', marginBottom: '24px' }}>
              <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div style={{ marginLeft: '16px' }}>
                <h2 style={{ margin: 0 }}>{viewCustomer.tenKH || 'Chưa cập nhật'}</h2>
                <p>{viewCustomer.email || 'Chưa cập nhật'}</p>
                <Tag color={viewCustomer.xoa ? 'red' : 'green'}>
                  {viewCustomer.xoa ? 'Đã xóa' : 'Hoạt động'}
                </Tag>
              </div>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane
                tab={<span><UserOutlined />Thông tin cá nhân</span>}
                key="1"
              >
                <p><strong>Mã khách hàng:</strong> {viewCustomer.maKH}</p>
                <p><strong>Họ tên:</strong> {viewCustomer.tenKH || 'Chưa cập nhật'}</p>
                <p><strong>Email:</strong> {viewCustomer.email || 'Chưa cập nhật'}</p>
                <p><strong>Số điện thoại:</strong> {viewCustomer.phone || 'Chưa cập nhật'}</p>
                <p><strong>Trạng thái:</strong> <Tag color={viewCustomer.xoa ? 'red' : 'green'}>
                  {viewCustomer.xoa ? 'Đã xóa' : 'Hoạt động'}
                </Tag></p>
              </TabPane>
              <TabPane
                tab={<span><HistoryOutlined />Lịch sử đặt phòng</span>}
                key="2"
              >
                <Table
                  columns={bookingColumns}
                  dataSource={bookingHistory}
                  rowKey="maDatPhong"
                  pagination={{ pageSize: 5 }}
                  loading={loadingHistory}
                />
              </TabPane>
              <TabPane
                tab={<span><HistoryOutlined />Thông tin hóa đơn</span>}
                key="3"
              >
                <Table
                  columns={invoiceColumns}
                  dataSource={invoices}
                  rowKey="maHD"
                  pagination={{ pageSize: 5 }}
                  loading={loadingInvoice}
                />
              </TabPane>
            </Tabs>
          </>
        )}
      </Modal>

      {/* Modal tạo khách hàng mới */}
      <Modal
        title="Thêm khách hàng mới"
        open={isCreateModalVisible}
        onCancel={handleCreateCancel}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateCustomer}
        >
          <Form.Item
            name="tenKH"
            label="Tên khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="Nhập địa chỉ email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu cho tài khoản" />
          </Form.Item>

          <Form.Item
            name="maVaiTro"
            label="Vai trò"
            initialValue={0}
          >
            <Select>
              <Select.Option value={0}>Khách hàng thường</Select.Option>
              <Select.Option value={1}>Khách hàng VIP</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={handleCreateCancel} style={{ marginRight: 8 }}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={creatingCustomer}>
                Tạo khách hàng
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal cập nhật khách hàng */}
      <Modal
        title="Cập nhật thông tin khách hàng"
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
      >
        {editingCustomer && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateCustomer}
            initialValues={{
              tenKH: editingCustomer.tenKH,
              email: editingCustomer.email,
              phone: editingCustomer.phone,
              xoa: editingCustomer.xoa
            }}
          >
            <Form.Item
              name="tenKH"
              label="Tên khách hàng"
              rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
            >
              <Input placeholder="Nhập tên khách hàng" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input placeholder="Nhập địa chỉ email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              name="xoa"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Đã xóa"
                unCheckedChildren="Hoạt động"
              />
            </Form.Item>

            <Form.Item>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={handleEditCancel} style={{ marginRight: 8 }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={updatingCustomer}>
                  Cập nhật
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal xác nhận xóa khách hàng */}
      <Modal
        title="Xác nhận xóa khách hàng"
        open={isDeleteModalVisible}
        onCancel={handleDeleteCancel}
        footer={[
          <Button key="cancel" onClick={handleDeleteCancel}>
            Hủy
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={isDeleting}
            onClick={handleConfirmDelete}
          >
            Xóa
          </Button>,
        ]}
      >
        {customerToDelete && (
          <p>Bạn có chắc chắn muốn xóa khách hàng "{customerToDelete.tenKH}" không?</p>
        )}
      </Modal>

      {/* Modal không có quyền */}
      <NoPermissionModal
        visible={noPermissionModal.visible}
        action={noPermissionModal.action}
        onClose={() => setNoPermissionModal({ visible: false, action: '' })}
      />
    </div>
  );
};

export default CustomerManagement;
