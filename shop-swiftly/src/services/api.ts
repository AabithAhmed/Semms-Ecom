import axios from "axios";

const apiInstance = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops by checking _retry flag
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
            originalRequest._retry = true;
            try {
                await axios.post("/api/auth/refresh", {}, { withCredentials: true });
                return apiInstance(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("user");
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const api = {
    // Products
    getProducts: async (params?: any) => {
        const { data } = await apiInstance.get("/products", { params });
        return data;
    },
    getProduct: async (id: string) => {
        const { data } = await apiInstance.get(`/products/${id}`);
        return data;
    },
    // Admin Products (Secured endpoints)
    getAdminProducts: async () => {
        const { data } = await apiInstance.get("/products/admin/all");
        return data;
    },
    createProduct: async (productData: any) => {
        const { data } = await apiInstance.post("/products", productData);
        return data;
    },
    updateProduct: async (id: string, productData: any) => {
        const { data } = await apiInstance.put(`/products/${id}`, productData);
        return data;
    },
    deleteProduct: async (id: string) => {
        const { data } = await apiInstance.delete(`/products/${id}`);
        return data;
    },
    // Categories
    getCategories: async () => {
        const { data } = await apiInstance.get("/categories");
        return data;
    },
    createCategory: async (categoryData: any) => {
        const { data } = await apiInstance.post("/categories", categoryData);
        return data;
    },
    deleteCategory: async (id: string) => {
        const { data } = await apiInstance.delete(`/categories/${id}`);
        return data;
    },
    // Auth
    login: async (credentials: any) => {
        const { data } = await apiInstance.post("/auth/login", credentials);
        return data;
    },
    register: async (userData: any) => {
        const { data } = await apiInstance.post("/auth/register", userData);
        return data;
    },
    logout: async () => {
        const { data } = await apiInstance.post("/auth/logout");
        return data;
    },
    // Cart
    getCart: async (sessionId?: string) => {
        const { data } = await apiInstance.get("/cart", { params: { sessionId } });
        return data;
    },
    syncCart: async (items: any[], sessionId?: string) => {
        const { data } = await apiInstance.post("/cart/sync", { items, sessionId });
        return data;
    },
    // Orders
    createOrder: async (orderData: any) => {
        const { data } = await apiInstance.post("/orders", orderData);
        return data;
    },
    getUserOrders: async () => {
        const { data } = await apiInstance.get("/user/orders");
        return data;
    },
    // Admin
    getDashboard: async () => {
        const { data } = await apiInstance.get("/admin/dashboard");
        return data;
    },
    getAdminOrders: async () => {
        const { data } = await apiInstance.get("/admin/orders");
        return data;
    },
    updateOrderStatus: async (id: string, status: string) => {
        const { data } = await apiInstance.put(`/admin/orders/${id}/status`, { status });
        return data;
    },
    getAdminCustomers: async () => {
        const { data } = await apiInstance.get("/admin/customers");
        return data;
    },
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append("image", file);
        const { data } = await apiInstance.post("/admin/upload-image", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });
        return data;
    }
};
