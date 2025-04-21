import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber, Card, Tag, message, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

// Mock data cho nhân viên
const mockStaffs = [
  { id: 1, name: 'Nguyễn Văn A', role: 'letan', username: 'letan1', password: '******', salary: 8000000 },
  { id: 2, name: 'Trần Thị B', role: 'donphong', username: 'donphong1', password: '******', salary: 7000000 },
  { id: 3, name: 'Lê Văn C', role: 'ketoan', username: 'ketoan1', password: '******', salary: 9000000 },
];

const roles = [
  { value: 'letan', label: 'Lễ tân' },
  { value: 'donphong', label: 'Dọn phòng' },
  { value: 'ketoan', label: 'Kế toán' },
  { value: 'quanly', label: 'Quản lý' },
];

const StaffManagement = () => {
  const [staffs, setStaffs] = useState(mockStaffs);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Định nghĩa columns cho bảng
  const columns: ColumnsType<any> = [
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Chức vụ',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleObj = roles.find(r => r.value === role);
        return roleObj ? roleObj.label : role;
      }
    },
    {
      title: 'Tài khoản',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Mật khẩu',
      dataIndex: 'password',
      key: 'password',
    },
    {
      title: 'Lương',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary) => `${salary.toLocaleString('vi-VN')} VNĐ`,
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

  // Xử lý chỉnh sửa nhân viên
  const handleEdit = (staff: any) => {
    setEditingStaff(staff);
    form.setFieldsValue({
      name: staff.name,
      role: staff.role,
      username: staff.username,
      password: '',  // Không hiển thị mật khẩu cũ
      salary: staff.salary
    });
    setIsModalVisible(true);
  };

  // Xử lý xóa nhân viên
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa nhân viên',
      content: 'Bạn có chắc chắn muốn xóa nhân viên này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setStaffs(staffs.filter(staff => staff.id !== id));
        message.success('Đã xóa nhân viên thành công');
      }
    });
  };

  // Xử lý thêm nhân viên mới
  const handleAdd = () => {
    setEditingStaff(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Xử lý lưu thông tin nhân viên
  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingStaff) {
        // Cập nhật nhân viên hiện có
        setStaffs(staffs.map(staff => 
          staff.id === editingStaff.id 
            ? { ...staff, ...values, password: values.password || staff.password } 
            : staff
        ));
        message.success('Cập nhật nhân viên thành công');
      } else {
        // Thêm nhân viên mới
        const newStaff = {
          id: Date.now(),
          ...values,
          password: values.password || '******'
        };
        setStaffs([...staffs, newStaff]);
        message.success('Thêm nhân viên mới thành công');
      }
      setIsModalVisible(false);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Quản lý nhân viên</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          Thêm nhân viên
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={staffs} 
        rowKey="id"
        bordered
      />

      <Modal
        title={editingStaff ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            {editingStaff ? "Cập nhật" : "Thêm"}
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
            <Input placeholder="Nhập họ tên nhân viên" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Chức vụ"
            rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
          >
            <Select placeholder="Chọn chức vụ">
              {roles.map(role => (
                <Option key={role.value} value={role.value}>{role.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="username"
            label="Tài khoản"
            rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
          >
            <Input placeholder="Nhập tên tài khoản" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingStaff ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
            rules={[{ required: !editingStaff, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            name="salary"
            label="Lương"
            rules={[{ required: true, message: 'Vui lòng nhập lương' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập lương"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagement;
