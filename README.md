# 🚀 Auto File Organizer - Web Edition (GitHub Pages Ready)

Ứng dụng **Auto File Organizer (Web Edition)** hỗ trợ tự động quét và phân loại tệp tin theo định dạng đuôi file (`.pdf`, `.png`, `.exe`, `.docx`, `.mp4`,...) trực tiếp trên trình duyệt web thông qua **Web File System Access API**.

---

## 🌟 Tính Năng Nổi Bật

- **0-Install & 100% Client-Side**: Chạy trực tiếp trên trình duyệt, không cần cài đặt phần mềm hay chạy backend exe.
- **Bảo Mật Tuyệt Đối**: Dữ liệu và tập tin 100% được xử lý tại máy tính cá nhân (Offline / Local), không gửi dữ liệu lên bất kỳ máy chủ nào.
- **Giao Diện Glassmorphism Hiện Đại**: Hỗ trợ 3 phân hệ trang: Trang chủ (Dashboard), Quản lý quy tắc (Category Rules) và Lịch sử hoạt động (Activity Logs).
- **GitHub Pages Ready**: Sẵn sàng đăng tải và host hoàn toàn miễn phí trên GitHub Pages.

---

## 🌐 Trình Duyệt Hỗ Trợ

Tính năng thao tác tệp tin trên máy tính qua trình duyệt yêu cầu chuẩn **File System Access API**:
- ✅ **Google Chrome** (v86+)
- ✅ **Microsoft Edge** (v86+)
- ✅ **Brave Browser**
- ✅ **Opera**

*(Lưu ý: Firefox & Safari hiện chưa hỗ trợ đầy đủ API làm việc với ổ đĩa cục bộ)*

---

## 🛠️ Hướng Dẫn Đăng Tải Lên GitHub Pages

### Bước 1: Khởi tạo Repository trên GitHub
1. Truy cập [GitHub.com](https://github.com) và tạo một **New Repository** mới.
2. Đặt tên repository (ví dụ: `auto-file-organizer`).

### Bước 2: Push code từ máy tính lên GitHub
Mở Terminal / PowerShell tại thư mục dự án và chạy các lệnh sau:

```bash
git init
git add .
git commit -m "Initial commit - Web Edition"
git branch -M main
git remote add origin https://github.com/TÊN_USERNAME_CỦA_BẠN/auto-file-organizer.git
git push -u origin main
```

### Bước 3: Bật tính năng GitHub Pages
1. Trên GitHub, vào mục **Settings** của Repository -> chọn mục **Pages** (ở cột bên trái).
2. Tại mục **Build and deployment**:
   - **Source**: Chọn `Deploy from a branch`.
   - **Branch**: Chọn `main` / `root` -> bấm **Save**.
3. Đợi khoảng 1-2 phút, GitHub sẽ cấp cho bạn một đường dẫn trang web dạng:  
   `https://TÊN_USERNAME_CỦA_BẠN.github.io/auto-file-organizer/`

---

## 📖 Hướng Dẫn Sử Dụng Web App

1. Truy cập vào đường dẫn trang web GitHub Pages của bạn.
2. Tại màn hình **Trang Chủ**, bấm nút **"Chọn..."** ở mục **Thư mục nguồn** và chọn thư mục cần phân loại (ví dụ: Thư mục Downloads).
3. Trình duyệt sẽ hiển thị hộp thoại xin cấp quyền đọc/ghi -> bấm **"Cho phép" / "Allow"**.
4. Bấm nút **"BẮT ĐẦU"** -> Các tệp tin sẽ tự động được gom nhóm và phân loại vào các thư mục tương ứng!
