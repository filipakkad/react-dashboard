export type ColNames = {
  id: string,
  name: string,
}[];
export type Data = Record<ColNames[number]["id"], unknown>;

export type TableData = {
  data: Data[],
  columns: ColNames,
  count: number,
}

export enum FilterOption {
  containsExactly = "containsExactly",
  notContainsExactly = "notContainsExactly",
}

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

