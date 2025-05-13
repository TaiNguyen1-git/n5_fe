import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Input, Tag, Space, Modal, message, Spin, Form, InputNumber, Upload, Popconfirm } from 'antd';
import { EyeOutlined, ReloadOutlined, EditOutlined, SaveOutlined, UploadOutlined, PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

// Định nghĩa cấu trúc dữ liệu phòng theo API
interface Room {
  maPhong: number;
  soPhong: string;
  tenPhong?: string;
  moTa?: string;
  hinhAnh?: string;
  giaTien?: number;
  soLuongKhach?: number;
  trangThai: number;
  tenTT?: string;
  loaiPhong?: string;
}

// Trạng thái phòng
const statuses = [
  { value: 1, label: 'Available', color: 'green' },
  { value: 2, label: 'Booked', color: 'blue' },
  { value: 3, label: 'In Use', color: 'orange' },
  { value: 4, label: 'Cleaning', color: 'purple' },
];

// API URLs with fallbacks
const API_URLS = [
  '/api/Phong/GetAll', // Use proxy from Next.js config
  'https://ptud-web-1.onrender.com/api/Phong/GetAll', // Direct API call
  '/api/rooms', // Local Next.js API route
  '/api/proxy-rooms', // Another possible local API route
];

// Mock data for fallback when API is completely unavailable
const MOCK_ROOMS = [
  {
    maPhong: 1,
    soPhong: 'P101',
    tenPhong: 'Phòng Standard 101',
    moTa: 'Phòng tiêu chuẩn với đầy đủ tiện nghi',
    giaTien: 500000,
    soLuongKhach: 2,
    trangThai: 1,
    tenTT: 'Available',
    loaiPhong: 'Standard'
  },
  {
    maPhong: 2,
    soPhong: 'P102',
    tenPhong: 'Phòng Deluxe 102',
    moTa: 'Phòng cao cấp với view đẹp',
    giaTien: 800000,
    soLuongKhach: 2,
    trangThai: 2,
    tenTT: 'Booked',
    loaiPhong: 'Deluxe'
  },
  {
    maPhong: 3,
    soPhong: 'P201',
    tenPhong: 'Phòng Suite 201',
    moTa: 'Phòng suite rộng rãi',
    giaTien: 1200000,
    soLuongKhach: 4,
    trangThai: 3,
    tenTT: 'In Use',
    loaiPhong: 'Suite'
  },
];

// Định nghĩa các loại phòng
const roomTypeOptions = [
  { value: 1, label: 'Standard' },
  { value: 2, label: 'Deluxe' },
  { value: 3, label: 'Suite' },
  { value: 4, label: 'VIP' },
];

const RoomManagement = () => {
  const [form] = Form.useForm();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Format room data from API response
  const formatRoomData = (data: any[]): Room[] => {
    return data.map((room: any) => ({
      maPhong: room.maPhong || room.id || 0,
      soPhong: room.soPhong || '',
      tenPhong: room.ten || room.tenPhong || `Phòng ${room.soPhong}`,
      moTa: room.moTa || '',
      hinhAnh: room.hinhAnh || '',
      giaTien: room.loaiPhong?.giaPhong || room.giaTien || 0,
      soLuongKhach: room.soNguoi || room.soLuongKhach || 0,
      trangThai: room.trangThaiPhong?.maTT || room.trangThai || 1,
      tenTT: room.trangThaiPhong?.tenTT || room.tenTT || '',
      loaiPhong: room.loaiPhong?.tenLoai || room.loaiPhong || ''
    }));
  };

  // Fetch rooms from API with fallback mechanisms
  const fetchRooms = async () => {
    setLoading(true);
    setError('');

    // Try each API endpoint in sequence
    for (let i = 0; i < API_URLS.length; i++) {
      try {
        console.log(`Trying API endpoint: ${API_URLS[i]}`);
        const response = await axios.get(API_URLS[i], {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        // Handle different response formats
        if (response.data) {
          let formattedRooms: Room[] = [];

          if (Array.isArray(response.data.items)) {
            // Format for API response with items array
            formattedRooms = formatRoomData(response.data.items);
          } else if (Array.isArray(response.data)) {
            // Format for direct array response
            formattedRooms = formatRoomData(response.data);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Format for response with data property
            formattedRooms = formatRoomData(response.data.data);
          }

          if (formattedRooms.length > 0) {
            setRooms(formattedRooms);
            setLoading(false);
            return; // Success, exit the function
          }
        }

        // If we get here, the response format wasn't recognized
        console.warn(`Unrecognized data format from ${API_URLS[i]}`);

      } catch (err) {
        console.error(`Error fetching rooms from ${API_URLS[i]}:`, err);
        // Continue to the next API endpoint
      }
    }

    // If all API calls failed, use mock data as last resort
    console.warn('All API endpoints failed, using mock data');
    setRooms(MOCK_ROOMS);
    message.warning('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
    setError('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
    setLoading(false);
  };

  // Load rooms when component mounts
  useEffect(() => {
    fetchRooms();
  }, []);

  const handleView = (room: Room) => {
    setViewingRoom(room);
    setViewModal(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.setFieldsValue({
      soPhong: room.soPhong,
      soNguoi: room.soLuongKhach,
      moTa: room.moTa,
      hinhAnh: room.hinhAnh,
      maLoaiPhong: getLoaiPhongId(room.loaiPhong),
      trangThai: room.trangThai
    });
    setEditModal(true);
  };

  // Lấy mã loại phòng từ tên loại phòng
  const getLoaiPhongId = (tenLoaiPhong?: string): number => {
    if (!tenLoaiPhong) return 1; // Mặc định là Standard

    const loaiPhong = roomTypeOptions.find(type =>
      type.label.toLowerCase() === tenLoaiPhong.toLowerCase()
    );
    return loaiPhong?.value || 1;
  };

  // Xử lý cập nhật phòng
  const handleUpdateRoom = async (values: any) => {
    setSubmitting(true);
    try {
      // Chuẩn bị dữ liệu gửi lên API
      const updateData = {
        soPhong: values.soPhong,
        soNguoi: values.soNguoi,
        hinhAnh: values.hinhAnh || '',
        moTa: values.moTa || '',
        maLoaiPhong: values.maLoaiPhong,
        trangThai: values.trangThai
      };

      // Hiển thị thông tin đang gửi lên API để debug
      console.log('Sending update data:', updateData);

      // Thử các endpoint API khác nhau
      const apiEndpoints = [
        `/api/Phong/Update/${values.soPhong}`,
        `https://ptud-web-1.onrender.com/api/Phong/Update/${values.soPhong}`,
        `/api/rooms/${values.soPhong}`
      ];

      let success = false;
      let errorMessage = '';

      // Thử từng endpoint cho đến khi thành công
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying to update room using endpoint: ${endpoint}`);
          const response = await axios.put(endpoint, updateData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 giây timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log('Update successful with response:', response.data);
            break;
          }
        } catch (endpointError: any) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError);
          errorMessage = endpointError.response?.data?.message || endpointError.message;
          // Tiếp tục thử endpoint tiếp theo
        }
      }

      if (success) {
        message.success('Cập nhật phòng thành công');
        setEditModal(false);
        fetchRooms(); // Tải lại danh sách phòng
      } else {
        message.error(`Cập nhật phòng thất bại: ${errorMessage || 'Không thể kết nối đến máy chủ'}`);
      }
    } catch (err: any) {
      console.error('Error updating room:', err);
      message.error(`Không thể cập nhật phòng: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleTypeFilter = (value: string) => {
    setFilterType(value);
  };

  const handleStatusFilter = (value: string) => {
    setFilterStatus(value);
  };

  const handleRefresh = () => {
    fetchRooms();
  };

  // Xử lý xóa phòng
  const handleDeleteRoom = async (roomId: number) => {
    try {
      // Hiển thị thông báo đang xóa
      const loadingMessage = message.loading('Đang xóa phòng...', 0);

      // Chuẩn bị dữ liệu gửi lên API
      const deleteData = {
        end: true
      };

      // Thử các endpoint API khác nhau
      const apiEndpoints = [
        `/api/Phong/Delete/${roomId}`,
        `https://ptud-web-1.onrender.com/api/Phong/Delete/${roomId}`,
        `/api/rooms/${roomId}`
      ];

      let success = false;
      let errorMessage = '';

      // Thử từng endpoint cho đến khi thành công
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying to delete room using endpoint: ${endpoint}`);
          const response = await axios.put(endpoint, deleteData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 giây timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log('Delete successful with response:', response.data);
            break;
          }
        } catch (endpointError: any) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError);
          errorMessage = endpointError.response?.data?.message || endpointError.message;
          // Tiếp tục thử endpoint tiếp theo
        }
      }

      // Đóng thông báo loading
      loadingMessage();

      if (success) {
        message.success('Xóa phòng thành công');
        fetchRooms(); // Tải lại danh sách phòng
      } else {
        // Thử phương thức DELETE nếu PUT không thành công
        try {
          const response = await axios.delete(`/api/rooms/${roomId}`);
          if (response.status >= 200 && response.status < 300) {
            message.success('Xóa phòng thành công');
            fetchRooms(); // Tải lại danh sách phòng
            return;
          }
        } catch (deleteError) {
          console.error('Error with DELETE method:', deleteError);
        }

        message.error(`Xóa phòng thất bại: ${errorMessage || 'Không thể kết nối đến máy chủ'}`);
      }
    } catch (err: any) {
      console.error('Error deleting room:', err);
      message.error(`Không thể xóa phòng: ${err.message}`);
    }
  };

  // Mở modal tạo phòng mới
  const handleOpenCreateModal = () => {
    form.resetFields();
    setCreateModal(true);
  };

  // Xử lý tạo phòng mới
  const handleCreateRoom = async (values: any) => {
    setSubmitting(true);
    try {
      // Chuẩn bị dữ liệu gửi lên API
      const createData: any = {
        soPhong: values.soPhong,
        soNguoi: values.soNguoi,
        moTa: values.moTa || '',
        maLoaiPhong: values.maLoaiPhong,
        trangThai: values.trangThai || 1
      };

      // Nếu có hình ảnh, thêm vào dữ liệu
      if (values.hinhAnh) {
        createData.hinhAnh = values.hinhAnh;
      }

      console.log('Sending create data:', createData);

      // Thử các endpoint API khác nhau
      const apiEndpoints = [
        '/api/Phong/Create',
        'https://ptud-web-1.onrender.com/api/Phong/Create',
        '/api/rooms'
      ];

      let success = false;
      let errorMessage = '';

      // Thử từng endpoint cho đến khi thành công
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying to create room using endpoint: ${endpoint}`);
          const response = await axios.post(endpoint, createData, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000 // 10 giây timeout
          });

          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log('Create successful with response:', response.data);
            break;
          }
        } catch (endpointError: any) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError);
          errorMessage = endpointError.response?.data?.message || endpointError.message;
          // Tiếp tục thử endpoint tiếp theo
        }
      }

      if (success) {
        message.success('Tạo phòng mới thành công');
        setCreateModal(false);
        fetchRooms(); // Tải lại danh sách phòng
      } else {
        message.error(`Tạo phòng mới thất bại: ${errorMessage || 'Không thể kết nối đến máy chủ'}`);
      }
    } catch (err: any) {
      console.error('Error creating room:', err);
      message.error(`Không thể tạo phòng mới: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.soPhong.toLowerCase().includes(searchText.toLowerCase()) ||
                         (room.tenPhong && room.tenPhong.toLowerCase().includes(searchText.toLowerCase()));
    const matchesType = filterType ? room.loaiPhong === filterType : true;
    const matchesStatus = filterStatus ? room.trangThai.toString() === filterStatus : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  const columns: ColumnsType<Room> = [
    {
      title: 'Số phòng',
      dataIndex: 'soPhong',
      key: 'soPhong',
      sorter: (a, b) => a.soPhong.localeCompare(b.soPhong),
    },
    {
      title: 'Tên phòng',
      dataIndex: 'tenPhong',
      key: 'tenPhong',
      render: (tenPhong, record) => tenPhong || `Phòng ${record.soPhong}`,
    },
    {
      title: 'Loại phòng',
      dataIndex: 'loaiPhong',
      key: 'loaiPhong',
      render: (loaiPhong) => loaiPhong || 'Chưa phân loại',
      sorter: (a, b) => (a.loaiPhong || '').localeCompare(b.loaiPhong || ''),
    },
    {
      title: 'Số người',
      dataIndex: 'soLuongKhach',
      key: 'soLuongKhach',
      sorter: (a, b) => (a.soLuongKhach || 0) - (b.soLuongKhach || 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai, record) => {
        const statusInfo = statuses.find(s => s.value === trangThai);
        return (
          <Tag color={statusInfo?.color || 'default'}>
            {record.tenTT || statusInfo?.label || 'Unknown'}
          </Tag>
        );
      },
      sorter: (a, b) => (a.trangThai || 0) - (b.trangThai || 0),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
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
            onClick={() => handleEdit(record)}
            type="default"
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa phòng"
            description="Bạn có chắc chắn muốn xóa phòng này không?"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDeleteRoom(record.maPhong)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Input.Search
            placeholder="Tìm kiếm phòng"
            onSearch={handleSearch}
            style={{ width: 200, backgroundColor: '#fff' }}
            allowClear
          />
          <Select
            placeholder="Loại phòng"
            style={{ width: 150, backgroundColor: '#fff' }}
            dropdownStyle={{ backgroundColor: '#fff' }}
            allowClear
            onChange={handleTypeFilter}
            options={[
              { value: 'Standard', label: 'Standard' },
              { value: 'Deluxe', label: 'Deluxe' },
              { value: 'Suite', label: 'Suite' },
              { value: 'VIP', label: 'VIP' },
            ]}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150, backgroundColor: '#fff' }}
            dropdownStyle={{ backgroundColor: '#fff' }}
            allowClear
            onChange={handleStatusFilter}
            options={statuses.map(s => ({ value: s.value.toString(), label: s.label, style: { color: '#333' } }))}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
          >
            Thêm phòng mới
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#cf1322' }}>{error}</span>
            <Button
              type="primary"
              size="small"
              onClick={handleRefresh}
              icon={<ReloadOutlined />}
            >
              Thử lại
            </Button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={filteredRooms}
        rowKey="maPhong"
        pagination={{ pageSize: 10 }}
        loading={{
          spinning: loading,
          tip: 'Đang tải dữ liệu phòng...',
          size: 'large'
        }}
        locale={{
          emptyText: (
            <div style={{ padding: '20px 0' }}>
              <p>Không có dữ liệu phòng</p>
              <Button
                type="primary"
                onClick={handleRefresh}
                icon={<ReloadOutlined />}
              >
                Tải lại dữ liệu
              </Button>
            </div>
          )
        }}
      />

      <Modal
        title="Chi tiết phòng"
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={[
          <Button key="close" onClick={() => setViewModal(false)}>
            Đóng
          </Button>
        ]}
        style={{ top: 20 }}
      >
        {viewingRoom && (
          <div>
            <p><strong>Số phòng:</strong> {viewingRoom.soPhong}</p>
            <p><strong>Tên phòng:</strong> {viewingRoom.tenPhong || `Phòng ${viewingRoom.soPhong}`}</p>
            <p><strong>Loại phòng:</strong> {viewingRoom.loaiPhong || 'Chưa phân loại'}</p>
            <p><strong>Trạng thái:</strong>
              <Tag color={statuses.find(s => s.value === viewingRoom.trangThai)?.color || 'default'}>
                {viewingRoom.tenTT || statuses.find(s => s.value === viewingRoom.trangThai)?.label || 'Unknown'}
              </Tag>
            </p>
            <p><strong>Mô tả:</strong> {viewingRoom.moTa || 'Phòng tiêu chuẩn với đầy đủ tiện nghi'}</p>
            <p><strong>Giá:</strong> {viewingRoom.giaTien ? `${viewingRoom.giaTien.toLocaleString('vi-VN')} VNĐ/đêm` : 'Chưa cập nhật'}</p>
            <p><strong>Số người:</strong> {viewingRoom.soLuongKhach || 2}</p>
            <p><strong>Tiện ích:</strong> Wifi, TV, Điều hòa, Tủ lạnh</p>
            {viewingRoom.hinhAnh && (
              <div style={{ marginTop: '16px' }}>
                <p><strong>Hình ảnh:</strong></p>
                <img
                  src={viewingRoom.hinhAnh}
                  alt={`Phòng ${viewingRoom.soPhong}`}
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/rooms/default-room.jpg';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal chỉnh sửa phòng */}
      <Modal
        title="Chỉnh sửa phòng"
        open={editModal}
        onCancel={() => setEditModal(false)}
        footer={null}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateRoom}
        >
          <Form.Item
            name="soPhong"
            label="Số phòng"
            rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="soNguoi"
            label="Số người"
            rules={[{ required: true, message: 'Vui lòng nhập số người' }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="moTa"
            label="Mô tả"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Hình ảnh"
            extra="Nhập URL hoặc tải lên từ máy tính"
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Form.Item
                name="hinhAnh"
                noStyle
              >
                <Input style={{ flex: 1 }} placeholder="URL hình ảnh" />
              </Form.Item>
              <Upload
                name="file"
                action="/api/upload"
                showUploadList={false}
                beforeUpload={(file) => {
                  // Kiểm tra kích thước file (tối đa 5MB)
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('Hình ảnh phải nhỏ hơn 5MB!');
                    return Upload.LIST_IGNORE;
                  }
                  return true;
                }}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    // Khi upload thành công, cập nhật URL vào form
                    const imageUrl = info.file.response?.url || '';
                    form.setFieldsValue({ hinhAnh: imageUrl });
                    message.success(`${info.file.name} đã được tải lên thành công`);
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} tải lên thất bại.`);
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>
                  Tải lên
                </Button>
              </Upload>
            </div>
          </Form.Item>

          {/* Hiển thị xem trước hình ảnh nếu có */}
          <Form.Item
            shouldUpdate={(prevValues, currentValues) => prevValues.hinhAnh !== currentValues.hinhAnh}
          >
            {({ getFieldValue }) => {
              const imageUrl = getFieldValue('hinhAnh');
              return imageUrl ? (
                <div style={{ marginBottom: '16px' }}>
                  <p>Xem trước:</p>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/rooms/default-room.jpg';
                    }}
                  />
                </div>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            name="maLoaiPhong"
            label="Loại phòng"
            rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
          >
            <Select options={roomTypeOptions} />
          </Form.Item>

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select options={statuses.map(s => ({ value: s.value, label: s.label }))} />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={() => setEditModal(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting} icon={<SaveOutlined />}>
                Lưu thay đổi
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tạo phòng mới */}
      <Modal
        title="Thêm phòng mới"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRoom}
        >
          <Form.Item
            name="soPhong"
            label="Số phòng"
            rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
          >
            <Input placeholder="Ví dụ: P101" />
          </Form.Item>

          <Form.Item
            name="soNguoi"
            label="Số người"
            rules={[{ required: true, message: 'Vui lòng nhập số người' }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="moTa"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả về phòng" />
          </Form.Item>

          <Form.Item
            label="Hình ảnh"
            extra="Nhập URL hoặc tải lên từ máy tính"
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Form.Item
                name="hinhAnh"
                noStyle
              >
                <Input style={{ flex: 1 }} placeholder="URL hình ảnh" />
              </Form.Item>
              <Upload
                name="file"
                action="/api/upload"
                showUploadList={false}
                beforeUpload={(file) => {
                  // Kiểm tra kích thước file (tối đa 5MB)
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error('Hình ảnh phải nhỏ hơn 5MB!');
                    return Upload.LIST_IGNORE;
                  }
                  return true;
                }}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    // Khi upload thành công, cập nhật URL vào form
                    const imageUrl = info.file.response?.url || '';
                    form.setFieldsValue({ hinhAnh: imageUrl });
                    message.success(`${info.file.name} đã được tải lên thành công`);
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} tải lên thất bại.`);
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>
                  Tải lên
                </Button>
              </Upload>
            </div>
          </Form.Item>

          {/* Hiển thị xem trước hình ảnh nếu có */}
          <Form.Item
            shouldUpdate={(prevValues, currentValues) => prevValues.hinhAnh !== currentValues.hinhAnh}
          >
            {({ getFieldValue }) => {
              const imageUrl = getFieldValue('hinhAnh');
              return imageUrl ? (
                <div style={{ marginBottom: '16px' }}>
                  <p>Xem trước:</p>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/rooms/default-room.jpg';
                    }}
                  />
                </div>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            name="maLoaiPhong"
            label="Loại phòng"
            rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
          >
            <Select options={roomTypeOptions} />
          </Form.Item>

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            initialValue={1}
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select options={statuses.map(s => ({ value: s.value, label: s.label }))} />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={() => setCreateModal(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>
                Tạo phòng
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomManagement;
