import { FilterDTO, TableData } from "@/types";
import axios, { AxiosResponse } from "axios";
import { objectFiltersToStringArray } from "./utils";

const fetchTable = async ({ filters, tableName, page, perPage, columns }: { filters: FilterDTO[], tableName?: string, page: number, perPage: number, columns: string[] | null}) => {
  const { data } =  await axios.post(`${import.meta.env.BASE_URL}api/data`, { table: tableName, filters, page, perPage, columns }) as AxiosResponse<TableData>;
  return data;
}

export const queryTable = ({filters, tableName, page, perPage, columns } : { filters : FilterDTO[], tableName?: string, page: number, perPage: number, columns: string[] | null }) => ({
  queryFn: async () => fetchTable({ filters, tableName, page, perPage, columns }),
  queryKey: ['table', page, perPage, tableName, ...objectFiltersToStringArray(filters), ...[columns || []]],
})
