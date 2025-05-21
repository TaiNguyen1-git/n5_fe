import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Typography, Card, Row, Col, Statistic, Spin, Alert, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, TeamOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Employee, employeeService } from '../../../services/employeeService';
import { Position, positionService } from '../../../services/positionService';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [form] = Form.useForm();

  // Fetch employees, positions, and shifts when component mounts
  useEffect(() => {
    fetchEmployees();
    fetchPositions();
    fetchShifts();
  }, []);



  // Function to fetch positions from API
  const fetchPositions = async () => {
    setPositionsLoading(true);
    try {
      const data = await positionService.getAllPositions();
      console.log('Fetched positions data:', data);
      setPositions(data);
    } catch (error) {
      console.error('Error fetching positions:', error);
      message.error('Không thể tải danh sách chức vụ từ máy chủ.');
    } finally {
      setPositionsLoading(false);
    }
  };



  // Function to fetch shifts from API
  const fetchShifts = async () => {
    setShiftsLoading(true);
    try {
      const response = await axios.get('/api/get-shifts');
      console.log('Shifts API response:', response.data);

      if (response.data.success) {
        setShifts(response.data.data?.items || []);
      } else {
        message.error('Không thể lấy danh sách ca làm');
        setShifts([]);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      message.error('Đã xảy ra lỗi khi lấy danh sách ca làm');
      setShifts([]);
    } finally {
      setShiftsLoading(false);
    }
  };

  // Function to fetch employees from API
  const fetchEmployees = async (retryCount = 0) => {
    setLoading(true);
    try {
      // Lấy danh sách nhân viên
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees data:', data);

      // Lấy danh sách chức vụ nếu chưa có
      if (positions.length === 0) {
        await fetchPositions();
      }

      // Tạo mảng để lưu trữ nhân viên đã định dạng
      const formattedEmployees = [];

      // Xử lý từng nhân viên
      for (const item of data) {
        console.log('Processing employee data:', item);

        // Lấy thông tin cơ bản của nhân viên
        const employee = {
          id: item.id,
          maNV: item.id || item.maNV || (item.maNV_ ? parseInt(item.maNV_.toString()) : 0),
          hoTen: item.hoTen_ || item.hoTen || 'Không có tên',
          chucVu: item.chucVu_ || item.chucVu || 'Chưa phân công',
          chucVuId: item.chucVuId,
          taiKhoan: item.taiKhoan_ || item.taiKhoan || '',
          luong: item.luongCoBan || item.luong || 0,
          trangThai: item.trangThai
        };

        // Tìm chức vụ trong danh sách đã lấy trước
        if (item.chucVuId && positions.length > 0) {
          const foundPosition = positions.find(p => p.id === item.chucVuId);
          if (foundPosition) {
            if (foundPosition.tenChucVu) {
              employee.chucVu = foundPosition.tenChucVu;
              console.log(`Found position in cache for ${employee.hoTen}: ${foundPosition.tenChucVu}`);
            } else if (foundPosition.tenCV) {
              employee.chucVu = foundPosition.tenCV;
              console.log(`Found position in cache for ${employee.hoTen}: ${foundPosition.tenCV}`);
            }
          }
        }

        // Nếu không tìm thấy trong cache và có chucVuId, lấy từ API
        if (item.chucVuId && employee.chucVu === 'Chưa phân công') {
          try {
            console.log(`Fetching position details for employee ${employee.hoTen} with chucVuId: ${item.chucVuId}`);
            const positionData = await positionService.getPositionById(item.chucVuId);
            console.log(`Position data for employee ${employee.hoTen}:`, positionData);

            if (positionData) {
              console.log(`Position data structure:`, positionData);
              console.log(`Position data keys:`, Object.keys(positionData));

              // Ưu tiên sử dụng tenChucVu, nếu không có thì dùng tenCV
              if (positionData.tenChucVu) {
                employee.chucVu = positionData.tenChucVu;
                console.log(`Updated position for employee ${employee.hoTen}: ${positionData.tenChucVu}`);
              } else if (positionData.tenCV) {
                employee.chucVu = positionData.tenCV;
                console.log(`Updated position for employee ${employee.hoTen}: ${positionData.tenCV}`);
              } else {
                // Kiểm tra xem có trường nào khác chứa thông tin chức vụ không
                const keys = Object.keys(positionData);
                for (const key of keys) {
                  // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta đang truy cập động vào các trường
                  if (typeof positionData[key] === 'string' &&
                      (key.toLowerCase().includes('chuc') || key.toLowerCase().includes('role') || key.toLowerCase().includes('ten'))) {
                    // @ts-ignore
                    console.log(`Found potential position name in field ${key}: ${positionData[key]}`);
                    // @ts-ignore
                    employee.chucVu = positionData[key];
                    break;
                  }
                }

                if (employee.chucVu === 'Chưa phân công') {
                  console.log(`Position data for ID ${item.chucVuId} doesn't have any usable position name field`);
                }
              }
            } else {
              console.log(`No position data found for ID ${item.chucVuId}`);
            }
          } catch (posError) {
            console.error(`Error fetching position for employee ${employee.hoTen}:`, posError);
          }
        } else {
          console.log(`Using cached position data for employee ${employee.hoTen}`);
        }

        // Thêm nhân viên vào danh sách
        formattedEmployees.push(employee);
      }

      console.log('Formatted employees with position details:', formattedEmployees);
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
  const handleEdit = async (employee: Employee) => {
    console.log('Editing employee:', employee);
    setEditingEmployee(employee);

    // Lấy thông tin chi tiết của người dùng từ API nếu có tài khoản
    let email = '';
    let phone = '';
    let positionDetails = null;

    // Lấy thông tin người dùng
    if (employee.taiKhoan || employee.taiKhoan_) {
      try {
        // Gọi API để lấy thông tin chi tiết của người dùng
        const username = employee.taiKhoan || employee.taiKhoan_;
        const response = await axios.get(`/api/users/by-username?username=${username}`);

        if (response.data && response.data.success) {
          const userData = response.data.data;
          email = userData.email || '';
          phone = userData.phone || '';
          console.log('Fetched user data:', userData);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }

    // Lấy thông tin chi tiết về chức vụ
    try {
      // Nếu có chucVuId, ưu tiên sử dụng chucVuId để lấy thông tin chức vụ
      if (employee.chucVuId) {
        try {
          console.log(`Fetching position details for employee with chucVuId: ${employee.chucVuId}`);
          const positionData = await positionService.getPositionById(employee.chucVuId);

          if (positionData) {
            positionDetails = positionData;
            console.log('Fetched position details by ID:', positionDetails);

            // Cập nhật tên chức vụ nếu chưa có
            if (!employee.chucVu && !employee.chucVu_ && positionData.tenCV) {
              employee.chucVu = positionData.tenCV;
            }
          }
        } catch (posError) {
          console.error(`Error fetching position by ID ${employee.chucVuId}:`, posError);
        }
      }

      // Nếu không có chucVuId hoặc không lấy được thông tin từ API, tìm trong cache
      if (!positionDetails) {
        const positionName = employee.chucVu || employee.chucVu_;
        const foundPosition = positions.find(p =>
          (p.tenChucVu === positionName) || (p.tenCV === positionName)
        );

        if (foundPosition) {
          positionDetails = foundPosition;
          console.log('Found position in cache:', positionDetails);
        } else if (positionName) {
          console.log('Position not found in cache, will use the name directly:', positionName);
        }
      }
    } catch (error) {
      console.error('Error fetching position details:', error);
    }

    form.setFieldsValue({
      hoTen: employee.hoTen || employee.hoTen_,
      chucVu: employee.chucVu || employee.chucVu_,
      taiKhoan: employee.taiKhoan || employee.taiKhoan_,
      matKhau: '', // Don't show the old password
      email: email,
      phone: phone,
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
        if (editingEmployee) {
          // Update existing employee
          // Tìm chucVuId dựa trên tên chức vụ đã chọn
          let chucVuId = editingEmployee.chucVuId;
          const selectedPosition = positions.find(p =>
            (p.tenChucVu === values.chucVu) || (p.tenCV === values.chucVu)
          );
          if (selectedPosition) {
            chucVuId = selectedPosition.id || selectedPosition.maCV;
          }

          const apiData = {
            hoTen: values.hoTen,
            chucVuId: chucVuId || 0,
            caLamId: editingEmployee.caLamId || 1, // Giữ nguyên ca làm hoặc mặc định là 1
            luongCoBan: Number(values.luong) || 0,
            maVaiTro: editingEmployee.maVaiTro || 2, // Giữ nguyên vai trò hoặc mặc định là nhân viên
            trangThai: values.trangThai !== undefined ? values.trangThai : true
          };

          console.log('Updating employee with data:', apiData);

          // Cập nhật thông tin người dùng nếu có thay đổi email hoặc số điện thoại
          if (values.email || values.phone) {
            try {
              const userData = {
                TenTK: values.taiKhoan,
                TenHienThi: values.hoTen,
                Email: values.email || '',
                Phone: values.phone || '',
                MatKhau: values.matKhau || undefined
              };

              console.log('Updating user data:', userData);
              const userResponse = await axios.put('/api/User/Update', userData);
              console.log('User update response:', userResponse.data);
            } catch (userError) {
              console.error('Error updating user data:', userError);
              // Tiếp tục cập nhật thông tin nhân viên ngay cả khi cập nhật thông tin người dùng thất bại
            }
          }

          // Cập nhật thông tin nhân viên
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
          // Tạo nhân viên mới kèm tài khoản
          console.log('Creating new employee with account...');

          try {
            setLoading(true);

            // Tìm chucVuId dựa trên tên chức vụ đã chọn
            let chucVuId = 2; // Mặc định là 2 (nhân viên)
            const selectedPosition = positions.find(p =>
              (p.tenChucVu === values.chucVu) || (p.tenCV === values.chucVu)
            );
            if (selectedPosition) {
              chucVuId = selectedPosition.id || selectedPosition.maCV || 2;
              console.log(`Found position: ${values.chucVu}, ID: ${chucVuId}`);
            } else {
              console.log(`Position not found: ${values.chucVu}, using default ID: ${chucVuId}`);
            }

            // Chuẩn bị dữ liệu để tạo nhân viên
            const employeeData = {
              hoTen: values.hoTen,
              chucVuId: Number(chucVuId),
              caLamId: Number(values.caLam) || 6, // Lấy từ form hoặc mặc định là ca 6
              luongCoBan: Number(values.luong) || 0,
              maVaiTro: 2, // Luôn là 2 (nhân viên) khi tạo mới
              trangThai: values.trangThai !== undefined ? values.trangThai : true
            };

            console.log('Employee data before sending:', JSON.stringify(employeeData));

            // Gọi API proxy để tạo nhân viên
            const response = await axios.post('/api/create-employee', employeeData);
            console.log('Employee creation response:', response.data);

            if (response.data && response.data.success) {
              const newEmployee = {
                maNV: response.data?.data?.maNV || Date.now(),
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
                    <p>Nhân viên mới đã được tạo với thông tin:</p>
                    <p><strong>Họ tên:</strong> {values.hoTen}</p>
                    <p><strong>Chức vụ:</strong> {values.chucVu}</p>
                    <p><strong>Ca làm việc:</strong> {(() => {
                      const caLamId = Number(values.caLam);
                      // Tìm ca làm trong danh sách từ API
                      const selectedShift = shifts.find(s => s.id === caLamId);
                      if (selectedShift && selectedShift.tenCa) {
                        return selectedShift.tenCa;
                      }

                      // Fallback nếu không tìm thấy trong API
                      switch (caLamId) {
                        case 1: return 'Ca sáng (6h-14h)';
                        case 2: return 'Ca chiều (14h-22h)';
                        case 3: return 'Ca đêm (22h-6h)';
                        case 4: return 'Ca hành chính (8h-17h)';
                        case 5: return 'Ca linh hoạt';
                        case 6: return 'Ca toàn thời gian';
                        default: return `Ca ${caLamId}`;
                      }
                    })()}</p>
                    <p><strong>Vai trò:</strong> Nhân viên</p>
                    <p><strong>Lương:</strong> {Number(values.luong).toLocaleString('vi-VN')} VNĐ</p>
                    <p><strong>Trạng thái:</strong> {values.trangThai ? 'Đang làm việc' : 'Đã nghỉ việc'}</p>
                    <div style={{ marginTop: 15, padding: 10, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                      <p style={{ color: '#52c41a', fontWeight: 'bold' }}>Nhân viên đã được tạo thành công!</p>
                    </div>
                  </div>
                ),
                width: 500
              });
            } else {
              throw new Error(response.data?.message || 'Không thể tạo nhân viên mới');
            }
          } catch (error: any) {
            console.error('Error creating employee:', error);
            setLoading(false);

            // Xác định loại lỗi
            let errorTitle = 'Lỗi khi tạo nhân viên';
            let errorMessage = 'Không thể tạo nhân viên mới. ';
            let errorDetails = '';

            // Kiểm tra lỗi từ API response
            if (error.response && error.response.data) {
              // Lỗi từ API
              const responseData = error.response.data;
              console.error('Error response data:', responseData);

              // Xác định loại lỗi dựa trên thông báo
              if (responseData.message) {
                errorMessage = responseData.message;
              }

              // Thêm chi tiết lỗi nếu có
              if (responseData.error) {
                if (typeof responseData.error === 'string') {
                  errorDetails += responseData.error;
                } else {
                  errorDetails += JSON.stringify(responseData.error, null, 2);
                }
              }

              // Thêm stack trace nếu có
              if (responseData.stack) {
                errorDetails += '\n\nStack trace:\n' + responseData.stack;
              }
            } else {
              errorMessage += error.message || 'Vui lòng thử lại sau.';
              errorDetails = error.stack || '';
            }

            // Hiển thị thông báo lỗi chi tiết
            Modal.error({
              title: errorTitle,
              content: (
                <div>
                  <p>{errorMessage}</p>
                  {errorDetails && (
                    <div>
                      <p><strong>Chi tiết lỗi:</strong></p>
                      <pre style={{ maxHeight: '200px', overflow: 'auto', background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
                        {errorDetails}
                      </pre>
                    </div>
                  )}
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Gợi ý:</strong></p>
                    <ul>
                      <li>Kiểm tra xem tài khoản đã tồn tại chưa</li>
                      <li>Đảm bảo mật khẩu có ít nhất 6 ký tự</li>
                      <li>Kiểm tra kết nối mạng</li>
                    </ul>
                  </div>
                </div>
              ),
              width: 600
            });
            return;
          }
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
      filters: positions.length > 0
        ? positions.map(pos => ({
            text: pos.tenChucVu || pos.tenCV || '',
            value: pos.tenChucVu || pos.tenCV || ''
          }))
        : [
            { text: 'Quản lý', value: 'Quản lý' },
            { text: 'Nhân viên', value: 'Nhân viên' },
            { text: 'Lễ tân', value: 'Lễ tân' },
            { text: 'Kế toán', value: 'Kế toán' },
          ],
      onFilter: (value, record) => (record.chucVu || '').indexOf(value as string) === 0,
      render: (text, record) => {
        // Nếu đã có tên chức vụ và không phải "Chưa phân công", hiển thị trực tiếp
        if (text && text !== 'Chưa phân công') return text;

        // Nếu có chucVuId, tìm trong danh sách chức vụ đã lấy
        if (record.chucVuId) {
          // Tìm trong danh sách chức vụ đã lấy
          const foundPosition = positions.find(p => p.id === record.chucVuId);
          if (foundPosition) {
            const positionName = foundPosition.tenChucVu || foundPosition.tenCV;
            if (positionName) {
              // Cập nhật danh sách nhân viên
              setTimeout(() => {
                setEmployees(prev => prev.map(emp => {
                  if (emp.id === record.id) {
                    return {
                      ...emp,
                      chucVu: positionName
                    };
                  }
                  return emp;
                }));
              }, 0);

              return positionName;
            }
          }

          // Nếu không tìm thấy trong danh sách, lấy từ API
          const fetchPositionInfo = async () => {
            try {
              console.log(`Fetching position for employee ID ${record.id} with chucVuId ${record.chucVuId}`);
              const positionData = await positionService.getPositionById(record.chucVuId as number);

              if (positionData) {
                let positionName = null;

                // Ưu tiên sử dụng tenChucVu
                if (positionData.tenChucVu) {
                  positionName = positionData.tenChucVu;
                }
                // Nếu không có tenChucVu, sử dụng tenCV
                else if (positionData.tenCV) {
                  positionName = positionData.tenCV;
                }
                // Nếu không có cả hai, tìm trường khác
                else {
                  const keys = Object.keys(positionData);
                  for (const key of keys) {
                    // @ts-ignore
                    if (typeof positionData[key] === 'string' &&
                        (key.toLowerCase().includes('chuc') ||
                         key.toLowerCase().includes('role') ||
                         key.toLowerCase().includes('ten'))) {
                      // @ts-ignore
                      positionName = positionData[key];
                      break;
                    }
                  }
                }

                // Nếu tìm thấy tên chức vụ, cập nhật danh sách nhân viên
                if (positionName) {
                  setEmployees(prev => prev.map(emp => {
                    if (emp.id === record.id) {
                      return {
                        ...emp,
                        chucVu: positionName
                      };
                    }
                    return emp;
                  }));
                }
              }
            } catch (error) {
              console.error(`Error fetching position for employee ID ${record.id}:`, error);
            }
          };

          // Gọi hàm lấy thông tin chức vụ
          fetchPositionInfo();

          return <span><Spin size="small" style={{ marginRight: 5 }} />Đang tải...</span>;
        }

        // Nếu không có thông tin gì, hiển thị "Chưa phân công"
        return 'Chưa phân công';
      },
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
        <Space>
          <Button
            onClick={() => {
              // Hiển thị thông báo đang làm mới dữ liệu
              message.loading({ content: 'Đang làm mới dữ liệu...', key: 'refreshData', duration: 0 });

              // Tải lại dữ liệu
              Promise.all([
                fetchPositions(),
                fetchEmployees()
              ])
                .then(() => {
                  message.success({ content: 'Đã làm mới dữ liệu thành công!', key: 'refreshData', duration: 2 });
                })
                .catch((error) => {
                  console.error('Error refreshing data:', error);
                  message.error({ content: 'Không thể làm mới dữ liệu. Vui lòng thử lại!', key: 'refreshData', duration: 2 });
                });
            }}
            loading={loading || positionsLoading}
          >
            Làm mới dữ liệu
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm nhân viên
          </Button>
        </Space>
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
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSave}
            loading={loading}
          >
            {editingEmployee ? "Cập nhật" : "Thêm"}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
        >
          <div style={{ marginBottom: 16, padding: 10, background: '#f9f9f9', borderRadius: 4 }}>
            <Alert
              message="Thông tin nhân viên và tài khoản"
              description="Vui lòng điền đầy đủ thông tin để tạo nhân viên mới. Hệ thống sẽ tự động tạo tài khoản đăng nhập cho nhân viên."
              type="info"
              showIcon
            />
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hoTen"
                label="Họ tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Nhập họ tên nhân viên" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="chucVu"
                label="Chức vụ"
                rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
              >
                <Select
                  placeholder="Chọn chức vụ"
                  loading={positionsLoading}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    // Tìm chức vụ được chọn
                    const selectedPosition = positions.find(p =>
                      (p.tenChucVu === value) || (p.tenCV === value)
                    );

                    // Nếu chức vụ có lương cơ bản, cập nhật trường lương
                    if (selectedPosition && selectedPosition.luongCoBan) {
                      form.setFieldsValue({
                        luong: selectedPosition.luongCoBan
                      });
                    }
                  }}
                >
                  {positions.length > 0 ? (
                    positions.map(position => (
                      <Option key={position.id || position.maCV} value={position.tenChucVu || position.tenCV || ''}>
                        {position.tenChucVu || position.tenCV}
                      </Option>
                    ))
                  ) : (
                    <>
                      <Option value="Quản lý">Quản lý</Option>
                      <Option value="Nhân viên">Nhân viên</Option>
                      <Option value="Lễ tân">Lễ tân</Option>
                      <Option value="Kế toán">Kế toán</Option>
                      <Option value="Chưa phân công">Chưa phân công</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>



          <Divider orientation="left">Thông tin công việc</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="luong"
                label="Lương"
                rules={[{ required: true, message: 'Vui lòng nhập lương' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  // @ts-ignore - Bỏ qua lỗi TypeScript
                  parser={(value) => value ? value.replace(/\$\s?|(,*)/g, '') : '0'}
                  placeholder="Nhập lương nhân viên"
                  min={0}
                  prefix={<DollarOutlined />}
                />
              </Form.Item>

              {/* Hiển thị gợi ý lương dựa trên chức vụ đã chọn */}
              {form.getFieldValue('chucVu') && (
                <div style={{ marginTop: -15, marginBottom: 15, fontSize: 12, color: '#1890ff' }}>
                  {(() => {
                    const selectedPosition = positions.find(p =>
                      (p.tenChucVu === form.getFieldValue('chucVu')) ||
                      (p.tenCV === form.getFieldValue('chucVu'))
                    );
                    if (selectedPosition && selectedPosition.luongCoBan) {
                      return `Lương cơ bản cho chức vụ này: ${selectedPosition.luongCoBan.toLocaleString('vi-VN')} VNĐ`;
                    }
                    return null;
                  })()}
                </div>
              )}
            </Col>
            <Col span={12}>
              <Form.Item
                name="caLam"
                label="Ca làm việc"
                initialValue={6}
                rules={[{ required: true, message: 'Vui lòng chọn ca làm việc' }]}
              >
                <Select
                  placeholder="Chọn ca làm việc"
                  loading={shiftsLoading}
                >
                  {shifts.length > 0 ? (
                    shifts.map((shift: any) => (
                      <Option key={shift.id} value={shift.id}>
                        {shift.tenCa || `Ca ${shift.id}`}
                      </Option>
                    ))
                  ) : (
                    <>
                      <Option value={1}>Ca sáng (6h-14h)</Option>
                      <Option value={2}>Ca chiều (14h-22h)</Option>
                      <Option value={3}>Ca đêm (22h-6h)</Option>
                      <Option value={4}>Ca hành chính (8h-17h)</Option>
                      <Option value={5}>Ca linh hoạt</Option>
                      <Option value={6}>Ca toàn thời gian</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maVaiTro"
                label="Vai trò"
                initialValue={2} // Mặc định là nhân viên (2)
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select
                  placeholder="Chọn vai trò"
                  disabled={!editingEmployee} // Chỉ cho phép chỉnh sửa khi cập nhật nhân viên
                >
                  <Option value={1}>Admin</Option>
                  <Option value={2}>Nhân viên</Option>
                  <Option value={3}>Khách hàng</Option>
                </Select>
              </Form.Item>
              <div style={{ marginTop: -15, marginBottom: 15, fontSize: 12, color: '#1890ff' }}>
                Khi thêm nhân viên mới, vai trò mặc định là "Nhân viên"
              </div>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
