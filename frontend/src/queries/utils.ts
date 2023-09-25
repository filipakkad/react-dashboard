import { FilterDTO } from "@/types";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

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

const getFileName = (response: AxiosResponse) => {
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.indexOf('attachment') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      return matches[1].replace(/['"]/g, '');
    }
  }

  return undefined;
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
      const type = response.headers['content-type'];
      const fileName = getFileName(response)!;
      const blob = new Blob([response.data], { type });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    });
}