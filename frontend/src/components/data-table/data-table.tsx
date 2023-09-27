import { Data, TableData } from '@/types';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type DataTableProps = {
  tableData: TableData;
  isLoading?: boolean;
  footer?: React.ReactNode;
}

export const DataTable = (props: DataTableProps) => {
  const { tableData, isLoading, footer } = props;
  const { data, columns } = tableData;
  const preparedColumns: ColumnsType<Data> = columns.filter((column) => column.isSelected).map((column) => ({
    title: (
      <Typography.Text ellipsis={true}>
        {column.name}
      </Typography.Text>
    ),
    dataIndex: column.id,
    key: column.id,
    ellipsis: true,
    responsive: ['md'],
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