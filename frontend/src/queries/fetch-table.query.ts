import { FilterDTO, TableData } from "@/types";
import axios, { AxiosResponse } from "axios";
import { objectFiltersToStringArray } from "./utils";

const fetchTable = async ({ filters, tableName, page, perPage }: { filters: FilterDTO[], tableName?: string, page: number, perPage: number }) => {
  const { data } =  await axios.post(`${import.meta.env.BASE_URL}/api/data`, { table: tableName, filters, page, perPage }) as AxiosResponse<TableData>;
  return data;
}

export const queryTable = ({filters, tableName, page, perPage } : { filters : FilterDTO[], tableName?: string, page: number, perPage: number }) => ({
  queryFn: async () => fetchTable({ filters, tableName, page, perPage }),
  queryKey: ['table', page, perPage, tableName, ...objectFiltersToStringArray(filters)],
})
