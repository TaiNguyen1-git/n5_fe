import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportColumn {
  key: string;
  title: string;
  dataIndex?: string | string[];
  render?: (value: any, record: any) => string;
  width?: number;
}

export interface ExportOptions {
  filename?: string;
  title?: string;
  columns: ExportColumn[];
  data: any[];
  format: 'excel' | 'csv' | 'pdf';
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
}

class ExportService {
  // Get value from nested object path
  private getNestedValue(obj: any, path: string | string[]): any {
    if (typeof path === 'string') {
      return obj[path];
    }
    return path.reduce((current, key) => current?.[key], obj);
  }

  // Format data for export
  private formatDataForExport(data: any[], columns: ExportColumn[]): any[] {
    return data.map(record => {
      const formattedRecord: any = {};
      columns.forEach(column => {
        const value = column.dataIndex 
          ? this.getNestedValue(record, column.dataIndex)
          : record;
        
        formattedRecord[column.title] = column.render 
          ? column.render(value, record)
          : value || '';
      });
      return formattedRecord;
    });
  }

  // Export to Excel
  exportToExcel(options: ExportOptions): void {
    const { filename = 'export', title, columns, data } = options;
    
    const formattedData = this.formatDataForExport(data, columns);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Set column widths
    const colWidths = columns.map(col => ({ wch: col.width || 15 }));
    worksheet['!cols'] = colWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title || 'Data');
    
    // Add title row if provided
    if (title) {
      XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
      XLSX.utils.sheet_add_aoa(worksheet, [['']], { origin: 'A2' });
    }
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  // Export to CSV
  exportToCSV(options: ExportOptions): void {
    const { filename = 'export', columns, data } = options;
    
    const formattedData = this.formatDataForExport(data, columns);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export to PDF
  exportToPDF(options: ExportOptions): void {
    const { 
      filename = 'export', 
      title, 
      columns, 
      data, 
      orientation = 'portrait',
      pageSize = 'a4'
    } = options;
    
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });

    // Add title
    if (title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 20);
      
      // Add export date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Xuất ngày: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 30);
    }

    // Prepare table data
    const headers = columns.map(col => col.title);
    const rows = data.map(record => 
      columns.map(column => {
        const value = column.dataIndex 
          ? this.getNestedValue(record, column.dataIndex)
          : record;
        
        return column.render 
          ? column.render(value, record)
          : (value || '').toString();
      })
    );

    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: title ? 40 : 20,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 20, right: 14, bottom: 20, left: 14 },
    });

    doc.save(`${filename}.pdf`);
  }

  // Universal export method
  export(options: ExportOptions): void {
    switch (options.format) {
      case 'excel':
        this.exportToExcel(options);
        break;
      case 'csv':
        this.exportToCSV(options);
        break;
      case 'pdf':
        this.exportToPDF(options);
        break;
      default:
        throw new Error('Unsupported export format');
    }
  }

  // Export booking confirmation
  exportBookingConfirmation(booking: any, format: 'pdf' = 'pdf'): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('XÁC NHẬN ĐẶT PHÒNG', 105, 30, { align: 'center' });
    
    // Hotel info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('KHÁCH SẠN NHÓM 5', 105, 45, { align: 'center' });
    doc.text('Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM', 105, 55, { align: 'center' });
    doc.text('Điện thoại: +84 123 456 789', 105, 65, { align: 'center' });
    
    // Booking details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('THÔNG TIN ĐẶT PHÒNG', 20, 90);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const details = [
      `Mã đặt phòng: ${booking.maDatPhong || 'N/A'}`,
      `Khách hàng: ${booking.tenKH || 'N/A'}`,
      `Email: ${booking.email || 'N/A'}`,
      `Số điện thoại: ${booking.phone || 'N/A'}`,
      `Phòng: ${booking.soPhong || 'N/A'}`,
      `Loại phòng: ${booking.loaiPhong || 'N/A'}`,
      `Ngày nhận phòng: ${dayjs(booking.checkIn).format('DD/MM/YYYY')}`,
      `Ngày trả phòng: ${dayjs(booking.checkOut).format('DD/MM/YYYY')}`,
      `Số đêm: ${dayjs(booking.checkOut).diff(dayjs(booking.checkIn), 'day')}`,
      `Tổng tiền: ${booking.tongTien?.toLocaleString('vi-VN') || '0'} VNĐ`
    ];
    
    details.forEach((detail, index) => {
      doc.text(detail, 20, 105 + (index * 10));
    });
    
    // Footer
    doc.setFontSize(10);
    doc.text('Cảm ơn quý khách đã chọn dịch vụ của chúng tôi!', 105, 220, { align: 'center' });
    doc.text(`Ngày xuất: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 105, 230, { align: 'center' });
    
    doc.save(`xac-nhan-dat-phong-${booking.maDatPhong || 'unknown'}.pdf`);
  }
}

export const exportService = new ExportService();
export default exportService;
