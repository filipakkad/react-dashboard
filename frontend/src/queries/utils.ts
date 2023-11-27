import { FilterDTO } from "@/types";
import axios, { AxiosRequestConfig } from "axios";

export interface HttpClientRequestParameters<T> {
  url: string,
  payload?: T,
  headers?: Record<string, string>,
  // eslint-disable-next-line no-irregular-whitespace
  // TODO wywalić to any, na razie zostawiłem aby było zgodne z dokumentacją axiosa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any,
}

export const objectFiltersToStringArray = (filters: FilterDTO[]): string[] => {
  return filters.flatMap((filter) => Object.entries(filter).map(([key, value]) => `${key}=${value}`));
}

export const getFile = (parameters: HttpClientRequestParameters<void>): Promise<void> => {
  const { url, params, headers } = parameters;

  const options: AxiosRequestConfig = {
    responseType: 'blob',
    params,
    headers,
  };

  return axios.post(url, options)
    .then((response) => {
      const link = document.createElement('a');
      link.href = response.data.link;
      link.download = ""
      link.click();
    });
}