import { UserInfo } from "@/types";
import axios from "axios";

const fetchUserInfo = async (): Promise<UserInfo> => {
  const { data } =  await axios.get(`${import.meta.env.BASE_URL}api/user-info`);
  return data;
}

export const queryUserInfo = {
  queryFn: fetchUserInfo,
  queryKey: ['userInfo'],
}
