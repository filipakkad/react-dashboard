import { Data, TableData } from '@/types';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type DataTableProps = {
  tableData: TableData;
  isLoading?: boolean;
  footer?: React.ReactNode;
}

export const DataTable = (props: DataTableProps) => {
  const { tableData, isLoading, footer } = props;
  const { data, columns } = tableData;
  const preparedColumns: ColumnsType<Data> = columns.map((column) => ({
    title: column.name,
    dataIndex: column.id,
    key: column.id,
  }));

  return (
    <Table
      className='h-full'
      scroll={{ scrollToFirstRowOnChange: true, y: 'calc(100vh - 20rem)' }}
      footer={() => footer}
      loading={isLoading}
      pagination={false}
      columns={preparedColumns}
      dataSource={data}
      />
  );
}