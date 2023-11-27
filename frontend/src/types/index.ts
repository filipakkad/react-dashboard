export type ColNames = {
  id: string,
  name: string,
  isSelected: boolean,
}[];
export type Data = Record<ColNames[number]["id"], unknown>;

export type TableData = {
  data: Data[],
  columns: ColNames,
  count: number,
  allColumns: string[],
}

export enum FilterOption {
  containsExactly = "containsExactly",
  notContainsExactly = "notContainsExactly",
}

export type ChartData = Record<string, Array<unknown>>;

export type FilterDTO = {
  id: string,
} & {
  columnId: string,
  filterOption: FilterOption,
  filterValue: string[],
}

export type PaginationDTO = {
  page: number,
  perPage: number,
}

export type UserInfo = {
  userName: string;
}

