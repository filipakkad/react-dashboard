import { HttpClientRequestParameters, getFile } from "./utils"

export const downloadFile = async (parameters: Omit<HttpClientRequestParameters<void>, 'url'>) => {
  return getFile({...parameters, url: `${import.meta.env.BASE_URL}api/download` })
}