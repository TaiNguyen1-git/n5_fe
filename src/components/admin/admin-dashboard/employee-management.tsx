import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Typography, Card, Row, Col, Statistic } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Employee, employeeService } from '../../../services/employeeService';

const { Title } = Typography;
const { Option } = Select;

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Function to fetch employees from API
  const fetchEmployees = async (retryCount = 0) => {
    setLoading(true);
    try {
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees data:', data);

      // Chuyển đổi dữ liệu từ API sang định dạng phù hợp với component
      const formattedEmployees = data.map((item: any) => ({
        maNV: item.id || item.maNV || parseInt(item.maNV_) || 0,
        hoTen: item.hoTen_ || item.hoTen || 'Không có tên',
        chucVu: item.chucVu_ || item.chucVu || 'Chưa phân công',
        taiKhoan: item.taiKhoan_ || item.taiKhoan || '',
        luong: item.luongCoBan || item.luong || 0,
        trangThai: item.trangThai
      }));

      console.log('Formatted employees:', formattedEmployees);
      setEmployees(formattedEmployees);
    } catch (error: any) {
      console.error('Error fetching employees:', error);

      // Implement retry logic (max 3 retries)
      if (retryCount < 3) {
        message.warning(`Đang thử kết nối lại... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchEmployees(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      message.error('Không thể tải danh sách nhân viên từ máy chủ.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit employee
  const handleEdit = (employee: Employee) => {
    console.log('Editing employee:', employee);
    setEditingEmployee(employee);
    form.setFieldsValue({
      hoTen: employee.hoTen || employee.hoTen_,
      chucVu: employee.chucVu || employee.chucVu_,
      taiKhoan: employee.taiKhoan || employee.taiKhoan_,
      matKhau: '', // Don't show the old password
      luong: employee.luong || employee.luongCoBan || 0,
      trangThai: employee.trangThai !== undefined ? employee.trangThai : true
    });
    setIsModalVisible(true);
  };

  // Handle delete employee
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa nhân viên',
      content: 'Bạn có chắc chắn muốn xóa nhân viên này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          console.log(`Deleting employee with ID: ${id}`);
          // Gọi API xóa nhân viên
          const response = await employeeService.deleteEmployee(id);
          console.log('Delete response:', response);

          // Cập nhật UI sau khi xóa thành công
          setEmployees(employees.filter(employee => employee.maNV !== id));
          message.success('Đã xóa nhân viên thành công');
        } catch (error) {
          console.error('Error deleting employee:', error);
          message.error('Không thể xóa nhân viên. Vui lòng thử lại sau.');
        }
      }
    });
  };

  // Handle add new employee
  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle save employee (create or update)
  const handleSave = () => {
    form.validateFields().then(async values => {
      try {
        // Chuyển đổi dữ liệu từ form sang định dạng API yêu cầu
        const apiData = {
          hoTen_: values.hoTen,
          chucVu_: values.chucVu,
          taiKhoan_: values.taiKhoan,
          matKhau_: values.matKhau || undefined, // Chỉ gửi nếu có giá trị
          luongCoBan: Number(values.luong) || 0,
          trangThai: values.trangThai !== undefined ? values.trangThai : true
        };

        console.log('Sending data to API:', apiData);

        if (editingEmployee) {
          // Update existing employee
          await employeeService.updateEmployee(editingEmployee.maNV!, apiData);
          setEmployees(employees.map(employee =>
            employee.maNV === editingEmployee.maNV
              ? {
                  ...employee,
                  hoTen: values.hoTen,
                  chucVu: values.chucVu,
                  taiKhoan: values.taiKhoan,
                  luong: Number(values.luong) || 0,
                  trangThai: values.trangThai
                }
              : employee
          ));
          message.success('Cập nhật nhân viên thành công');
        } else {
          // Create new employee
          const response = await employeeService.createEmployee(apiData);
          console.log('API response after create:', response);

          const newEmployee = {
            maNV: response.data?.maNV || Date.now(),
            hoTen: values.hoTen,
            chucVu: values.chucVu,
            taiKhoan: values.taiKhoan,
            luong: Number(values.luong) || 0,
            trangThai: values.trangThai !== undefined ? values.trangThai : true
          };

          setEmployees([...employees, newEmployee]);
          Modal.success({
            title: 'Thêm nhân viên thành công',
            content: (
              <div>
                <p>Nhân viên mới đã được tạo với thông tin đăng nhập:</p>
                <p><strong>Tài khoản:</strong> {values.taiKhoan}</p>
                <p><strong>Mật khẩu:</strong> {values.matKhau ? '******' : 'Không có'}</p>
                <p>Nhân viên có thể sử dụng thông tin này để đăng nhập vào hệ thống.</p>
              </div>
            ),
          });
        }
        setIsModalVisible(false);
      } catch (error) {
        console.error('Error saving employee:', error);
        message.error('Không thể lưu thông tin nhân viên. Vui lòng thử lại sau.');
      }
    });
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const totalSalary = employees.reduce((sum, employee) => sum + (employee.luong || 0), 0);
  const averageSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;

  // Define columns for the table
  const columns: ColumnsType<Employee> = [
    {
      title: 'Họ tên',
      dataIndex: 'hoTen',
      key: 'hoTen',
      sorter: (a, b) => (a.hoTen || '').localeCompare(b.hoTen || ''),
      render: (text) => text || 'Không có tên',
    },
    {
      title: 'Chức vụ',
      dataIndex: 'chucVu',
      key: 'chucVu',
      filters: [
        { text: 'Quản lý', value: 'Quản lý' },
        { text: 'Nhân viên', value: 'Nhân viên' },
        { text: 'Lễ tân', value: 'Lễ tân' },
        { text: 'Kế toán', value: 'Kế toán' },
      ],
      onFilter: (value, record) => (record.chucVu || '').indexOf(value as string) === 0,
      render: (text) => text || 'Chưa phân công',
    },
    {
      title: 'Tài khoản',
      dataIndex: 'taiKhoan',
      key: 'taiKhoan',
      render: (text) => text || 'Không có',
    },
    {
      title: 'Mật khẩu',
      key: 'matKhau',
      render: () => '******', // Always show asterisks for security
    },
    {
      title: 'Lương',
      dataIndex: 'luong',
      key: 'luong',
      render: (luong) => `${(luong || 0).toLocaleString('vi-VN')} VNĐ`,
      sorter: (a, b) => (a.luong || 0) - (b.luong || 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai) => (
        <span style={{ color: trangThai ? 'green' : 'red' }}>
          {trangThai ? 'Đang làm việc' : 'Đã nghỉ việc'}
        </span>
      ),
      filters: [
        { text: 'Đang làm việc', value: true },
        { text: 'Đã nghỉ việc', value: false },
      ],
      onFilter: (value, record) => record.trangThai === value,
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
            onClick={() => handleDelete(record.maNV!)}
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Quản lý nhân viên</h2>
        <p>Xem và quản lý tất cả nhân viên trong hệ thống</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng nhân viên"
              value={totalEmployees}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng lương"
              value={totalSalary}
              valueStyle={{ color: '#1890ff' }}
              suffix="VNĐ"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Lương trung bình"
              value={averageSalary}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              suffix="VNĐ"
            />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Danh sách nhân viên</Title>
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
        dataSource={employees}
        rowKey={(record) => record.maNV?.toString() || Math.random().toString()}
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingEmployee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            {editingEmployee ? "Cập nhật" : "Thêm"}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="hoTen"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ tên nhân viên" />
          </Form.Item>

          <Form.Item
            name="chucVu"
            label="Chức vụ"
            rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
          >
            <Select placeholder="Chọn chức vụ">
              <Option value="Quản lý">Quản lý</Option>
              <Option value="Nhân viên">Nhân viên</Option>
              <Option value="Lễ tân">Lễ tân</Option>
              <Option value="Kế toán">Kế toán</Option>
              <Option value="Chưa phân công">Chưa phân công</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="taiKhoan"
            label="Tài khoản"
            rules={[
              { required: true, message: 'Vui lòng nhập tài khoản' },
              { min: 3, message: 'Tài khoản phải có ít nhất 3 ký tự' }
            ]}
            tooltip="Tài khoản này sẽ được sử dụng để đăng nhập vào hệ thống"
          >
            <Input placeholder="Nhập tên tài khoản" />
          </Form.Item>

          <Form.Item
            name="matKhau"
            label="Mật khẩu"
            rules={[
              {
                required: !editingEmployee,
                message: 'Vui lòng nhập mật khẩu'
              },
              {
                min: 6,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
              }
            ]}
            tooltip={editingEmployee ?
              "Để trống nếu không muốn thay đổi mật khẩu" :
              "Mật khẩu này sẽ được sử dụng để đăng nhập vào hệ thống"}
          >
            <Input.Password
              placeholder={editingEmployee ? "Nhập mật khẩu mới (để trống nếu không đổi)" : "Nhập mật khẩu"}
            />
          </Form.Item>

          <Form.Item
            name="luong"
            label="Lương"
            rules={[{ required: true, message: 'Vui lòng nhập lương' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder="Nhập lương nhân viên"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="trangThai"
            label="Trạng thái"
            initialValue={true}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value={true}>Đang làm việc</Option>
              <Option value={false}>Đã nghỉ việc</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
