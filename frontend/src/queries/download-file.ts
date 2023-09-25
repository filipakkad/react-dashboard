import { HttpClientRequestParameters, getFile } from "./utils"

export const downloadFile = (parameters: Omit<HttpClientRequestParameters<void>, 'url'>) => {
  getFile({...parameters, url: `${import.meta.env.BASE_URL}api/download` })
}