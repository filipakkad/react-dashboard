import App from "@/App";
import {
  createBrowserRouter,
} from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: `${import.meta.env.BASE_URL}`,
    element: (
      <App/>
    ),
  }
]);