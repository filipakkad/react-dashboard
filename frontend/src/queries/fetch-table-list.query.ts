import axios, { AxiosResponse } from "axios";

const fetchTablesList = async () => {
  const { data } =  await axios.get(`${import.meta.env.BASE_URL}/api/list-tables`) as AxiosResponse<string[]>;
  return data;
}

export const queryTablesList = {
  queryFn: fetchTablesList,
  queryKey: ['tablesList'],
}
