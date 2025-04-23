import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Typography, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getRegisteredUsers } from '../../../services/authService';

const { Title } = Typography;
const { Option } = Select;

// Sử dụng hàm getRegisteredUsers thay vì mock data
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch danh sách người dùng khi component được mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Hàm load danh sách người dùng từ localStorage
  const loadUsers = () => {
    const registeredUsers = getRegisteredUsers();
    const usersList = Object.keys(registeredUsers).map(username => {
      const user = registeredUsers[username];
      return {
        id: user.id || Math.random().toString(36).substring(2),
        username: user.username,
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber || 'Chưa cập nhật',
        status: 'active',
        gender: user.gender,
        birthDate: user.birthDate,
        address: user.address
      };
    });
    setUsers(usersList);
  };

  // Định nghĩa columns cho bảng
  const columns: ColumnsType<any> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
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

  // Xử lý chỉnh sửa người dùng
  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status
    });
    setIsModalVisible(true);
  };

  // Xử lý xóa người dùng
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa người dùng',
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        // Xóa người dùng khỏi state
        setUsers(users.filter(user => user.id !== id));
        
        // Cập nhật localStorage
        const registeredUsers = getRegisteredUsers();
        const userToDelete = users.find(user => user.id === id);
        if (userToDelete && userToDelete.username) {
          delete registeredUsers[userToDelete.username];
          localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
        }
        
        message.success('Đã xóa người dùng thành công');
      }
    });
  };

  // Xử lý lưu thông tin người dùng
  const handleSave = () => {
    form.validateFields().then(values => {
      // Cập nhật trên UI
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...values } 
          : user
      ));
      
      // Lưu vào localStorage
      const registeredUsers = getRegisteredUsers();
      if (editingUser && editingUser.username && registeredUsers[editingUser.username]) {
        registeredUsers[editingUser.username] = {
          ...registeredUsers[editingUser.username],
          fullName: values.name,
          email: values.email,
          phoneNumber: values.phone
        };
        localStorage.setItem('registered_users', JSON.stringify(registeredUsers));
      }
      
      setIsModalVisible(false);
      message.success('Cập nhật người dùng thành công');
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Quản lý người dùng</Title>
        <Button onClick={loadUsers} type="primary">Làm mới</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id"
        bordered
      />

      <Modal
        title="Chỉnh sửa người dùng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            Cập nhật
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
