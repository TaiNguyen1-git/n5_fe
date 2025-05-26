import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber, Card, Tag, message, Typography, Row, Col, Statistic, Spin, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, CloseOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { getRooms, PaginatedRoomResponse } from '../../../services/roomService';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Backend API URL
const BACKEND_API_URL = 'https://ptud-web-1.onrender.com/api';

// Add proxy option to handle CORS issues - change this to your actual frontend URL
const USE_PROXY = true;
const PROXY_URL = '/api';  // This assumes you've set up a proxy in your Next.js config

// Alternative options if the main API fails
const DIRECT_API_URLS = [
  'https://ptud-web-1.onrender.com/api/Phong/GetAll',
  'https://ptud-web-1.onrender.com/api/phong/getall', // Try lowercase
  'https://ptud-web-1.onrender.com/api/Phong/Get', // Try alternative endpoint
];

// Định nghĩa cấu trúc dữ liệu phòng dựa trên API response
interface Room {
  maPhong: number;
  datPhongs: null | any[];
  hinhAnhPhongs: null | any[];
  soPhong: string;
  soNguoi: number;
  moTa: string;
  xoa: null | boolean;
  maLoaiPhong: number;
  tenLoaiPhong: string;
  loaiPhong: {
    maLoai: number;
    tenLoai: string;
    giaPhong: number;
    phongs: null | any[];
  };
  trangThaiPhong: {
    maTT: number;
    tenTT: string;
    phongs: null | any[];
  };
}

const roomTypes = [
  { value: 'Single', label: 'Phòng đơn' },
  { value: 'Duo', label: 'Phòng đôi' },
  { value: 'Triple', label: 'Phòng ba' },
  { value: 'VIP', label: 'Phòng VIP' },
  { value: 'Family', label: 'Phòng gia đình' },
];

const roomStatuses = [
  { value: 'Available', label: 'Trống', color: 'green' },
  { value: 'Booked', label: 'Đã đặt', color: 'blue' },
  { value: 'Occupied', label: 'Đang sử dụng', color: 'orange' },
  { value: 'Maintenance', label: 'Đang bảo trì', color: 'red' },
  { value: 'Cleaning', label: 'Đang dọn dẹp', color: 'purple' },
];

// Mock data for when API is down completely
const MOCK_ROOMS: Room[] = [
  {
    maPhong: 1,
    datPhongs: null,
    hinhAnhPhongs: null,
    soPhong: "101",
    soNguoi: 2,
    moTa: "Phòng đơn tiêu chuẩn, view đẹp",
    xoa: null,
    maLoaiPhong: 1,
    tenLoaiPhong: "Single",
    loaiPhong: {
      maLoai: 1,
      tenLoai: "Single",
      giaPhong: 500000,
      phongs: null
    },
    trangThaiPhong: {
      maTT: 1,
      tenTT: "Available",
      phongs: null
    }
  },
  {
    maPhong: 2,
    datPhongs: null,
    hinhAnhPhongs: null,
    soPhong: "102",
    soNguoi: 3,
    moTa: "Phòng đôi rộng rãi",
    xoa: null,
    maLoaiPhong: 2,
    tenLoaiPhong: "Duo",
    loaiPhong: {
      maLoai: 2,
      tenLoai: "Duo",
      giaPhong: 800000,
      phongs: null
    },
    trangThaiPhong: {
      maTT: 2,
      tenTT: "Booked",
      phongs: null
    }
  }
];

// Utility function to make API calls with retry and error handling
const callApi = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data: any = null,
  retries: number = 2
): Promise<{ success: boolean; data?: any; status?: number; error?: any; message?: string }> => {
  let lastError: any = null;

  // Try with Axios first
  for (let i = 0; i <= retries; i++) {
    try {


      let response;
      if (method === 'GET') {
        response = await axios.get(url, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST') {
        response = await axios.post(url, data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'PUT') {
        response = await axios.put(url, data, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'DELETE') {
        response = await axios.delete(url, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (response) {
        return { success: true, data: response.data, status: response.status };
      }
    } catch (error) {
      lastError = error;

      // Wait before retrying (exponential backoff)
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  // Try with fetch as fallback
  try {

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    };

    const response = await fetch(url, options);

    if (response.ok) {
      const responseData = await response.json();
      return { success: true, data: responseData, status: response.status };
    }
  } catch (error) {
  }

  // Return failure if all attempts failed
  return {
    success: false,
    error: lastError,
    message: lastError?.message || 'Network Error'
  };
};

const RoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [form] = Form.useForm();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} của ${total} phòng`,
  });

  // Fetch danh sách phòng từ API
  useEffect(() => {
    fetchRooms(pagination.current, pagination.pageSize);
  }, []);

  // Handle table pagination change
  const handleTableChange = (page: number, pageSize?: number) => {
    const newPagination = {
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize,
    };
    setPagination(newPagination);
    fetchRooms(page, pageSize || pagination.pageSize);
  };

  const fetchRooms = async (pageNumber: number = 1, pageSize: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      // Use the new getRooms service with pagination
      const response = await getRooms(undefined, pageNumber, pageSize);

      if (response.success && response.data) {
        const paginatedData = response.data as PaginatedRoomResponse;

        // Format room data to match the existing Room interface
        const formattedRooms = paginatedData.items.map((room: any) => ({
          maPhong: room.maPhong,
          datPhongs: room.datPhongs || null,
          hinhAnhPhongs: room.hinhAnhPhongs || null,
          soPhong: room.soPhong || room.tenPhong || `Phòng ${room.maPhong}`,
          soNguoi: room.soNguoi || room.soLuongKhach || 2,
          moTa: room.moTa || '',
          xoa: room.xoa || null,
          maLoaiPhong: room.maLoaiPhong || 1,
          tenLoaiPhong: room.tenLoaiPhong || room.loaiPhong || 'Standard',
          loaiPhong: {
            maLoai: room.maLoaiPhong || 1,
            tenLoai: room.tenLoaiPhong || room.loaiPhong || 'Standard',
            giaPhong: room.giaTien || room.giaPhong || 500000,
            phongs: null
          },
          trangThaiPhong: {
            maTT: room.trangThai || 1,
            tenTT: room.trangThaiTen || 'Available',
            phongs: null
          }
        }));

        // Update rooms and pagination info
        setRooms(formattedRooms);
        setPagination(prev => ({
          ...prev,
          current: paginatedData.pageNumber,
          pageSize: paginatedData.pageSize,
          total: paginatedData.totalItems,
        }));

        setLoading(false);
        return;
      } else {
        throw new Error(response.message || 'Failed to fetch rooms');
      }
    } catch (error: any) {
      // Fallback to mock data
      setRooms(MOCK_ROOMS);
      setPagination(prev => ({
        ...prev,
        current: 1,
        total: MOCK_ROOMS.length,
      }));
      setError('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
      message.warning('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
      setLoading(false);
    }
  };

  // Lọc phòng theo loại và trạng thái
  const filteredRooms = rooms.filter(room => {
    const matchesType = filterType ? room.tenLoaiPhong === filterType : true;
    const matchesStatus = filterStatus ? room.trangThaiPhong.tenTT === filterStatus : true;
    return matchesType && matchesStatus;
  });

  // Thống kê phòng theo trạng thái
  const roomStats = {
    total: rooms.length,
    available: rooms.filter(room => room.trangThaiPhong.tenTT === 'Available').length,
    booked: rooms.filter(room => room.trangThaiPhong.tenTT === 'Booked').length,
    occupied: rooms.filter(room => room.trangThaiPhong.tenTT === 'Occupied').length,
    maintenance: rooms.filter(room => room.trangThaiPhong.tenTT === 'Maintenance').length,
  };

  // Định nghĩa columns cho bảng
  const columns: ColumnsType<Room> = [
    {
      title: 'Mã phòng',
      dataIndex: 'maPhong',
      key: 'maPhong',
      render: (id) => <strong>{id}</strong>,
    },
    {
      title: 'Số phòng',
      dataIndex: 'soPhong',
      key: 'soPhong',
    },
    {
      title: 'Loại phòng',
      dataIndex: 'tenLoaiPhong',
      key: 'tenLoaiPhong',
      filters: roomTypes.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value, record) => record.tenLoaiPhong === value,
    },
    {
      title: 'Giá phòng',
      key: 'giaPhong',
      render: (_, record) => `${record.loaiPhong.giaPhong.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => a.loaiPhong.giaPhong - b.loaiPhong.giaPhong,
    },
    {
      title: 'Trạng thái',
      key: 'trangThai',
      render: (_, record) => {
        const status = record.trangThaiPhong.tenTT;
        const roomStatus = roomStatuses.find(s => s.value === status);
        return (
          <Tag color={roomStatus?.color || 'default'}>
            {roomStatus?.label || status}
          </Tag>
        );
      },
      filters: roomStatuses.map(status => ({ text: status.label, value: status.value })),
      onFilter: (value, record) => record.trangThaiPhong.tenTT === value,
    },
    {
      title: 'Số khách tối đa',
      dataIndex: 'soNguoi',
      key: 'soNguoi',
      align: 'center',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => handleView(record)}
            size="small"
          >
            Xem
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.maPhong)}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Xử lý xem chi tiết phòng
  const handleView = (room: Room) => {
    setViewRoom(room);
    setIsViewModalVisible(true);
  };

  // Xử lý chỉnh sửa phòng
  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.setFieldsValue({
      soPhong: room.soPhong,
      tenLoaiPhong: room.tenLoaiPhong,
      giaPhong: room.loaiPhong.giaPhong,
      moTa: room.moTa,
      trangThai: room.trangThaiPhong.tenTT,
      soNguoi: room.soNguoi
    });
    setIsModalVisible(true);
  };

  // Xử lý xóa phòng với API mới
  const deleteStats = async (maPhong: number) => {
    try {
      // Using the exact format from the screenshot: /api/Phong/Delete/{id}
      const url = USE_PROXY
        ? `${PROXY_URL}/Phong/Delete/${maPhong}`
        : `${BACKEND_API_URL}/Phong/Delete/${maPhong}`;

      const result = await callApi('DELETE', url);

      if (result.success) {
        setRooms(rooms.filter(room => room.maPhong !== maPhong));
        message.success('Đã xóa phòng thành công');
      } else {
        message.error(`Lỗi khi xóa phòng: ${result.message}`);

        // Optimistic UI update even if server call failed
        if (window.confirm('Máy chủ không phản hồi. Bạn có muốn cập nhật giao diện không?')) {
          setRooms(rooms.filter(room => room.maPhong !== maPhong));
          message.warning('Đã cập nhật giao diện nhưng thay đổi có thể không được lưu trên máy chủ');
        }
      }
    } catch (error) {
      message.error('Lỗi khi xóa phòng');
    }
  };

  // Xử lý xóa phòng
  const handleDelete = (maPhong: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa phòng',
      content: 'Bạn có chắc chắn muốn xóa phòng này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteStats(maPhong)
    });
  };

  // Xử lý thêm phòng mới
  const handleAdd = () => {
    setEditingRoom(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Xử lý lưu thông tin phòng với API mới
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingRoom) {
        // Cập nhật phòng hiện có
        const updatedRoom = {
          maPhong: editingRoom.maPhong,
          soPhong: values.soPhong,
          soNguoi: values.soNguoi,
          moTa: values.moTa,
          maLoaiPhong: values.maLoaiPhong || editingRoom.maLoaiPhong,
          maTT: values.maTT || editingRoom.trangThaiPhong.maTT
        };

        // Using the exact format from the screenshot: /api/Phong/Update/{SoPhong}
        const updateUrl = USE_PROXY
          ? `${PROXY_URL}/Phong/Update/${updatedRoom.soPhong}`
          : `${BACKEND_API_URL}/Phong/Update/${updatedRoom.soPhong}`;

        const result = await callApi('PUT', updateUrl, updatedRoom);

        if (result.success) {
          message.success('Cập nhật phòng thành công');
          fetchRooms(pagination.current, pagination.pageSize); // Tải lại danh sách phòng
          setIsModalVisible(false);
        } else {
          message.error(`Không thể cập nhật phòng: ${result.message || 'Unknown error'}`);
        }
      } else {
        // Thêm phòng mới
        const newRoom = {
          soPhong: values.soPhong,
          soNguoi: values.soNguoi,
          moTa: values.moTa,
          maLoaiPhong: values.maLoaiPhong,
          maTT: values.maTT || 1 // Mặc định là Available
        };

        // Using the exact format from the screenshot: /api/Phong/Create
        const createUrl = USE_PROXY
          ? `${PROXY_URL}/Phong/Create`
          : `${BACKEND_API_URL}/Phong/Create`;

        const result = await callApi('POST', createUrl, newRoom);

        if (result.success) {
          message.success('Thêm phòng mới thành công');
          fetchRooms(pagination.current, pagination.pageSize); // Tải lại danh sách phòng
          setIsModalVisible(false);
        } else {
          message.error(`Không thể thêm phòng mới: ${result.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Quản lý phòng</Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchRooms(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={loading}
          >
            Thêm phòng
          </Button>
        </Space>
      </div>

      {error && !loading && rooms.length === 0 && (
        <Alert
          message="Lỗi kết nối"
          description={
            <div>
              <p>{error}</p>
              <p>Vui lòng kiểm tra kết nối mạng của bạn và thử lại.</p>
              <Button type="primary" onClick={() => fetchRooms(pagination.current, pagination.pageSize)} style={{ marginTop: 8 }}>
                Thử lại
              </Button>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Tổng số phòng"
              value={roomStats.total}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Phòng trống"
              value={roomStats.available}
              valueStyle={{ color: 'green' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Đã đặt"
              value={roomStats.booked}
              valueStyle={{ color: 'blue' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Đang sử dụng"
              value={roomStats.occupied}
              valueStyle={{ color: 'orange' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card>
            <Statistic
              title="Đang bảo trì"
              value={roomStats.maintenance}
              valueStyle={{ color: 'red' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Select
          placeholder="Lọc theo loại phòng"
          style={{ width: 200 }}
          allowClear
          onChange={(value) => setFilterType(value)}
        >
          {roomTypes.map(type => (
            <Option key={type.value} value={type.value}>{type.label}</Option>
          ))}
        </Select>
        <Select
          placeholder="Lọc theo trạng thái"
          style={{ width: 200 }}
          allowClear
          onChange={(value) => setFilterStatus(value)}
        >
          {roomStatuses.map(status => (
            <Option key={status.value} value={status.value}>{status.label}</Option>
          ))}
        </Select>
      </div>

      <Spin spinning={loading} tip="Đang tải dữ liệu...">
        <Table
          columns={columns}
          dataSource={filteredRooms}
          rowKey="maPhong"
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: pagination.showSizeChanger,
            showQuickJumper: pagination.showQuickJumper,
            showTotal: pagination.showTotal,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            hideOnSinglePage: false,
            simple: false,
            responsive: true,
          }}
          loading={{
            spinning: loading,
            tip: 'Đang tải dữ liệu phòng...',
            size: 'large'
          }}
        />
      </Spin>

      {/* Modal xem chi tiết phòng */}
      <Modal
        title="Chi tiết phòng"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {viewRoom && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>Mã phòng:</strong> {viewRoom.maPhong}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Số phòng:</strong> {viewRoom.soPhong}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Loại phòng:</strong> {viewRoom.tenLoaiPhong}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Giá phòng:</strong> {viewRoom.loaiPhong.giaPhong.toLocaleString('vi-VN')} VNĐ
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>Trạng thái:</strong> <Tag color={roomStatuses.find(s => s.value === viewRoom.trangThaiPhong.tenTT)?.color}>{roomStatuses.find(s => s.value === viewRoom.trangThaiPhong.tenTT)?.label || viewRoom.trangThaiPhong.tenTT}</Tag>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Số khách tối đa:</strong> {viewRoom.soNguoi} người
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <strong>Mô tả:</strong>
              <p>{viewRoom.moTa}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal thêm/sửa phòng */}
      <Modal
        title={editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            {editingRoom ? "Cập nhật" : "Thêm"}
          </Button>
        ]}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="soPhong"
                label="Số phòng"
                rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
              >
                <Input placeholder="Nhập số phòng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maLoaiPhong"
                label="Loại phòng"
                rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
              >
                <Select placeholder="Chọn loại phòng">
                  <Option value={1}>Phòng đơn</Option>
                  <Option value={2}>Phòng đôi</Option>
                  <Option value={3}>Phòng VIP</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maTT"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value={1}>Trống</Option>
                  <Option value={2}>Đã đặt</Option>
                  <Option value={3}>Đang sử dụng</Option>
                  <Option value={4}>Đang bảo trì</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="soNguoi"
                label="Số khách tối đa"
                rules={[{ required: true, message: 'Vui lòng nhập số khách tối đa' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="moTa"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả phòng' }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả phòng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomManagement;
