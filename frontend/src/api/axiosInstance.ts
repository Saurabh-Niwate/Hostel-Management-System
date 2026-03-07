import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ------------- MOCK API RESPONSES -------------
const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });
console.log("Mock Adapter initialized for axiosInstance.ts");

// Generic mocks for axiosInstance
// Any GET
mock.onGet(/.*/).reply(200, { data: "Fallback mock data for GET" });
// Any POST
mock.onPost(/.*/).reply(200, { data: "Fallback mock data for POST", message: "Success" });
// Any PUT
mock.onPut(/.*/).reply(200, { data: "Fallback mock data for PUT", message: "Success" });
// Any DELETE
mock.onDelete(/.*/).reply(200, { data: "Fallback mock data for DELETE", message: "Success" });

export default axiosInstance;