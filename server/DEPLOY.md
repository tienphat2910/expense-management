# Deploy Guide for Render.com

## Cấu hình Render Web Service

### 1. Build Settings
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Root Directory:** `server`

### 2. Environment Variables
Cần thiết lập các biến môi trường sau trong Render Dashboard:

```
MONGO_URI=mongodb+srv://tienphat29:letmeshowyou@cluster0.5gzsfbs.mongodb.net/?appName=Cluster0
PORT=5000
```

**Lưu ý:** PORT thường được Render tự động gán, không cần thiết lập thủ công.

### 3. Deployment Steps

1. **Tạo Web Service mới trên Render:**
   - Chọn repository GitHub
   - Chọn branch `main`
   - Root Directory: `server`

2. **Cấu hình Build & Deploy:**
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Thêm Environment Variables:**
   - `MONGO_URI`: MongoDB connection string
   - Các biến khác nếu cần

4. **Deploy:**
   - Click "Create Web Service"
   - Render sẽ tự động build và deploy

### 4. Kiểm tra Deployment

Sau khi deploy thành công, kiểm tra:
- Health check: `https://your-app.onrender.com/`
- API Status: `https://your-app.onrender.com/api/status`
- API Docs: `https://your-app.onrender.com/api-docs`

### 5. Troubleshooting

**Lỗi "Exited with status 1":**
- Kiểm tra logs để xem lỗi cụ thể
- Đảm bảo MONGO_URI được set đúng
- Kiểm tra MongoDB connection string có thể truy cập từ Render IP
- Đảm bảo Node version tương thích (>= 18.x)

**MongoDB Connection Issues:**
- Whitelist tất cả IP addresses (0.0.0.0/0) trong MongoDB Atlas
- Kiểm tra connection string có đúng format không

**Port Issues:**
- Render tự động gán PORT, không cần set manual
- Server code đã có fallback: `PORT = process.env.PORT || 5000`
