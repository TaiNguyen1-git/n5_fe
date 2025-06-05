import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    try {
      const {
        filename = 'export',
        title,
        columns,
        data,
        orientation = 'portrait',
        pageSize = 'a4'
      } = options;

      // Validate data
      if (!data || data.length === 0) {
        throw new Error('Không có dữ liệu để xuất');
      }

      if (!columns || columns.length === 0) {
        throw new Error('Không có cột dữ liệu để xuất');
      }

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize
      });

      // Set font to support Vietnamese characters
      try {
        doc.setFont('helvetica', 'normal');
      } catch (fontError) {      }

      // Add title
      if (title) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');

        // Center the title
        const pageWidth = doc.internal.pageSize.getWidth();
        const titleWidth = doc.getTextWidth(title);
        const titleX = (pageWidth - titleWidth) / 2;

        doc.text(title, titleX, 20);

        // Add export date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const dateText = `Xuất ngày: ${dayjs().format('DD/MM/YYYY HH:mm')}`;
        const dateWidth = doc.getTextWidth(dateText);
        const dateX = (pageWidth - dateWidth) / 2;
        doc.text(dateText, dateX, 30);
      }

      // Prepare table data
      const headers = columns.map(col => col.title || col.key);
      const rows = data.map(record =>
        columns.map(column => {
          try {
            const value = column.dataIndex
              ? this.getNestedValue(record, column.dataIndex)
              : record;

            const result = column.render
              ? column.render(value, record)
              : (value || '').toString();

            // Ensure the result is a string and handle special characters
            return String(result).replace(/[^\x00-\x7F]/g, function(char) {
              // Replace non-ASCII characters with their closest ASCII equivalent
              const replacements: { [key: string]: string } = {
                'đ': 'd', 'Đ': 'D',
                'ă': 'a', 'Ă': 'A',
                'â': 'a', 'Â': 'A',
                'ê': 'e', 'Ê': 'E',
                'ô': 'o', 'Ô': 'O',
                'ơ': 'o', 'Ơ': 'O',
                'ư': 'u', 'Ư': 'U',
                'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
                'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
                'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
                'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
                'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
                'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
              };
              return replacements[char] || char;
            });
          } catch (error) {            return '';
          }
        })
      );

      // Add table with better error handling
      try {
        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: title ? 40 : 20,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            font: 'helvetica',
            fontStyle: 'normal'
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 20, right: 14, bottom: 20, left: 14 },
          tableWidth: 'auto',
          columnStyles: columns.reduce((acc, col, index) => {
            if (col.width) {
              acc[index] = { cellWidth: col.width };
            }
            return acc;
          }, {} as any)
        });
      } catch (tableError) {        throw new Error('Lỗi khi tạo bảng dữ liệu trong PDF');
      }

      // Save the PDF
      try {
        doc.save(`${filename}.pdf`);
      } catch (saveError) {        throw new Error('Lỗi khi lưu file PDF');
      }

    } catch (error) {      throw error;
    }
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
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font
      doc.setFont('helvetica', 'normal');

      // Helper function to convert Vietnamese text
      const convertText = (text: string): string => {
        return String(text).replace(/[^\x00-\x7F]/g, function(char) {
          const replacements: { [key: string]: string } = {
            'đ': 'd', 'Đ': 'D',
            'ă': 'a', 'Ă': 'A', 'â': 'a', 'Â': 'A',
            'ê': 'e', 'Ê': 'E', 'ô': 'o', 'Ô': 'O',
            'ơ': 'o', 'Ơ': 'O', 'ư': 'u', 'Ư': 'U',
            'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
            'Á': 'A', 'À': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
            'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
            'É': 'E', 'È': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
            'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
            'Í': 'I', 'Ì': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
            'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
            'Ó': 'O', 'Ò': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
            'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
            'Ú': 'U', 'Ù': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
            'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
            'Ý': 'Y', 'Ỳ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
          };
          return replacements[char] || char;
        });
      };

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const pageWidth = doc.internal.pageSize.getWidth();
      const title = convertText('XAC NHAN DAT PHONG');
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 30);

      // Hotel info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const hotelName = convertText('KHACH SAN NHOM 5');
      const hotelNameWidth = doc.getTextWidth(hotelName);
      doc.text(hotelName, (pageWidth - hotelNameWidth) / 2, 45);

      const address = convertText('Dia chi: 123 Duong ABC, Quan XYZ, TP.HCM');
      const addressWidth = doc.getTextWidth(address);
      doc.text(address, (pageWidth - addressWidth) / 2, 55);

      const phone = convertText('Dien thoai: +84 123 456 789');
      const phoneWidth = doc.getTextWidth(phone);
      doc.text(phone, (pageWidth - phoneWidth) / 2, 65);

      // Booking details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const detailsTitle = convertText('THONG TIN DAT PHONG');
      doc.text(detailsTitle, 20, 90);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const checkInDate = booking.checkIn ? dayjs(booking.checkIn).format('DD/MM/YYYY') : 'N/A';
      const checkOutDate = booking.checkOut ? dayjs(booking.checkOut).format('DD/MM/YYYY') : 'N/A';
      const nights = booking.checkIn && booking.checkOut ?
        dayjs(booking.checkOut).diff(dayjs(booking.checkIn), 'day') : 0;

      const details = [
        convertText(`Ma dat phong: ${booking.maDatPhong || 'N/A'}`),
        convertText(`Khach hang: ${booking.tenKH || 'N/A'}`),
        convertText(`Email: ${booking.email || 'N/A'}`),
        convertText(`So dien thoai: ${booking.phone || 'N/A'}`),
        convertText(`Phong: ${booking.soPhong || 'N/A'}`),
        convertText(`Loai phong: ${booking.loaiPhong || 'N/A'}`),
        convertText(`Ngay nhan phong: ${checkInDate}`),
        convertText(`Ngay tra phong: ${checkOutDate}`),
        convertText(`So dem: ${nights}`),
        convertText(`Tong tien: ${booking.tongTien?.toLocaleString('vi-VN') || '0'} VND`)
      ];

      details.forEach((detail, index) => {
        doc.text(detail, 20, 105 + (index * 10));
      });

      // Footer
      doc.setFontSize(10);
      const thankYou = convertText('Cam on quy khach da chon dich vu cua chung toi!');
      const thankYouWidth = doc.getTextWidth(thankYou);
      doc.text(thankYou, (pageWidth - thankYouWidth) / 2, 220);

      const exportDate = convertText(`Ngay xuat: ${dayjs().format('DD/MM/YYYY HH:mm')}`);
      const exportDateWidth = doc.getTextWidth(exportDate);
      doc.text(exportDate, (pageWidth - exportDateWidth) / 2, 230);

      doc.save(`xac-nhan-dat-phong-${booking.maDatPhong || 'unknown'}.pdf`);

    } catch (error) {      throw new Error('Loi khi xuat xac nhan dat phong');
    }
  }
}

export const exportService = new ExportService();
export default exportService;
