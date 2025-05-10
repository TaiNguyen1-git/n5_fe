import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber, Card, Tag, message, Typography, Row, Col, Statistic } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, CloseOutlined, HomeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Định nghĩa cấu trúc dữ liệu phòng
interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  description: string;
  status: string;
  maxGuests: number;
  bedType: string;
  area: number;
  features: string[];
}

const roomTypes = [
  { value: 'single', label: 'Phòng đơn' },
  { value: 'duo', label: 'Phòng đôi' },
  { value: 'triple', label: 'Phòng ba' },
  { value: 'vip', label: 'Phòng VIP' },
  { value: 'family', label: 'Phòng gia đình' },
];

const roomStatuses = [
  { value: 'available', label: 'Trống', color: 'green' },
  { value: 'booked', label: 'Đã đặt', color: 'blue' },
  { value: 'occupied', label: 'Đang sử dụng', color: 'orange' },
  { value: 'maintenance', label: 'Đang bảo trì', color: 'red' },
  { value: 'cleaning', label: 'Đang dọn dẹp', color: 'purple' },
];

const RoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewRoom, setViewRoom] = useState<any>(null);
  const [form] = Form.useForm();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Lọc phòng theo loại và trạng thái
  const filteredRooms = rooms.filter(room => {
    const matchesType = filterType ? room.type === filterType : true;
    const matchesStatus = filterStatus ? room.status === filterStatus : true;
    return matchesType && matchesStatus;
  });

  // Thống kê phòng theo trạng thái
  const roomStats = {
    total: rooms.length,
    available: rooms.filter(room => room.status === 'available').length,
    booked: rooms.filter(room => room.status === 'booked').length,
    occupied: rooms.filter(room => room.status === 'occupied').length,
    maintenance: rooms.filter(room => room.status === 'maintenance').length,
  };

  // Định nghĩa columns cho bảng
  const columns: ColumnsType<any> = [
    {
      title: 'Số phòng',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <strong>{id}</strong>,
    },
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại phòng',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const roomType = roomTypes.find(t => t.value === type);
        return roomType ? roomType.label : type;
      },
      filters: roomTypes.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Giá phòng',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const roomStatus = roomStatuses.find(s => s.value === status);
        return (
          <Tag color={roomStatus?.color || 'default'}>
            {roomStatus?.label || status}
          </Tag>
        );
      },
      filters: roomStatuses.map(status => ({ text: status.label, value: status.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Số khách tối đa',
      dataIndex: 'maxGuests',
      key: 'maxGuests',
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
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Xử lý xem chi tiết phòng
  const handleView = (room: any) => {
    setViewRoom(room);
    setIsViewModalVisible(true);
  };

  // Xử lý chỉnh sửa phòng
  const handleEdit = (room: any) => {
    setEditingRoom(room);
    form.setFieldsValue({
      name: room.name,
      type: room.type,
      price: room.price,
      description: room.description,
      status: room.status,
      maxGuests: room.maxGuests,
      bedType: room.bedType,
      area: room.area,
      features: room.features.join(', '),
    });
    setIsModalVisible(true);
  };

  // Xử lý xóa phòng
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa phòng',
      content: 'Bạn có chắc chắn muốn xóa phòng này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setRooms(rooms.filter(room => room.id !== id));
        message.success('Đã xóa phòng thành công');
      }
    });
  };

  // Xử lý thêm phòng mới
  const handleAdd = () => {
    setEditingRoom(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Xử lý lưu thông tin phòng
  const handleSave = () => {
    form.validateFields().then(values => {
      const features = values.features.split(',').map((feature: string) => feature.trim());

      if (editingRoom) {
        // Cập nhật phòng hiện có
        setRooms(rooms.map(room =>
          room.id === editingRoom.id
            ? { ...room, ...values, features }
            : room
        ));
        message.success('Cập nhật phòng thành công');
      } else {
        // Thêm phòng mới
        const newRoom = {
          id: Math.max(...rooms.map(r => r.id)) + 1,
          ...values,
          features,
        };
        setRooms([...rooms, newRoom]);
        message.success('Thêm phòng mới thành công');
      }
      setIsModalVisible(false);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Quản lý phòng</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Thêm phòng
        </Button>
      </div>

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

      <Table
        columns={columns}
        dataSource={filteredRooms}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
      />

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
                  <strong>Số phòng:</strong> {viewRoom.id}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Tên phòng:</strong> {viewRoom.name}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Loại phòng:</strong> {roomTypes.find(t => t.value === viewRoom.type)?.label || viewRoom.type}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Giá phòng:</strong> {viewRoom.price.toLocaleString('vi-VN')} VNĐ
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Trạng thái:</strong> <Tag color={roomStatuses.find(s => s.value === viewRoom.status)?.color}>{roomStatuses.find(s => s.value === viewRoom.status)?.label}</Tag>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <strong>Số khách tối đa:</strong> {viewRoom.maxGuests} người
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Loại giường:</strong> {viewRoom.bedType}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Diện tích:</strong> {viewRoom.area} m²
                </div>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <strong>Mô tả:</strong>
              <p>{viewRoom.description}</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <strong>Tiện nghi:</strong>
              <ul>
                {viewRoom.features.map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
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
                name="name"
                label="Tên phòng"
                rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}
              >
                <Input placeholder="Nhập tên phòng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại phòng"
                rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
              >
                <Select placeholder="Chọn loại phòng">
                  {roomTypes.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá phòng"
                rules={[{ required: true, message: 'Vui lòng nhập giá phòng' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Nhập giá phòng"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  {roomStatuses.map(status => (
                    <Option key={status.value} value={status.value}>{status.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="maxGuests"
                label="Số khách tối đa"
                rules={[{ required: true, message: 'Vui lòng nhập số khách tối đa' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="bedType"
                label="Loại giường"
                rules={[{ required: true, message: 'Vui lòng nhập loại giường' }]}
              >
                <Input placeholder="Ví dụ: Giường đôi, 2 Giường đơn" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="area"
                label="Diện tích (m²)"
                rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả phòng' }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả phòng" />
          </Form.Item>

          <Form.Item
            name="features"
            label="Tiện nghi (phân cách bằng dấu phẩy)"
            rules={[{ required: true, message: 'Vui lòng nhập tiện nghi phòng' }]}
          >
            <TextArea rows={3} placeholder="Ví dụ: Wi-Fi miễn phí, Điều hòa, TV màn hình phẳng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomManagement;
