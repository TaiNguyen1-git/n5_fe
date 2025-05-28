// Simple test to verify PDF export functionality
const { exportService } = require('./src/services/exportService.ts');

// Test data
const testData = [
  { id: 1, name: 'Test 1', value: 100 },
  { id: 2, name: 'Test 2', value: 200 },
  { id: 3, name: 'Test 3', value: 300 }
];

const testColumns = [
  { key: 'id', title: 'ID', dataIndex: 'id' },
  { key: 'name', title: 'Name', dataIndex: 'name' },
  { key: 'value', title: 'Value', dataIndex: 'value' }
];

try {
  exportService.export({
    filename: 'test-export',
    title: 'Test Export',
    columns: testColumns,
    data: testData,
    format: 'pdf'
  });
  console.log('PDF export test successful!');
} catch (error) {
  console.error('PDF export test failed:', error);
}
