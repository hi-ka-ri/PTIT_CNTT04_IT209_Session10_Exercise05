# Bài 5: Tự động hóa điều phối đa dịch vụ với Docker Compose & File .env

## 1. Mục tiêu
- Đóng gói cụm ứng dụng đa dịch vụ (Backend Web API + PostgreSQL Database từ Bài 4) thành tệp khai báo `docker-compose.yml` theo chuẩn **Infrastructure as Code (IaC)**.
- Quản lý vòng đời dịch vụ bằng **Docker Compose CLI v2** (`docker compose`).
- Tách biệt và bảo mật các thông tin cấu hình nhạy cảm (Tên database, thông tin đăng nhập, cổng kết nối) ra file `.env`, cung cấp file mẫu `.env.example` và thiết lập `.gitignore` để không đẩy file nhạy cảm lên Git repository.

---

## 2. Cấu trúc thư mục
```text
ex5/
├── .env                # Chứa thông tin cấu hình và thông tin nhạy cảm (không commit lên Git)
├── .env.example        # File mẫu cấu hình mẫu để chia sẻ
├── .gitignore          # Cấu hình bỏ qua tệp .env và node_modules/
├── docker-compose.yml  # Tệp điều phối hạ tầng đa dịch vụ (Docker Compose v2)
├── Dockerfile          # Đóng gói ứng dụng Backend
├── package.json        # Khai báo dependencies cho Backend
├── server.js           # Mã nguồn Web API Backend
└── README.md           # Hướng dẫn chi tiết và tài liệu kiểm thử
```

---

## 3. Khai báo Docker Compose & Quản lý biến môi trường

### 3.1. Tệp `.env` và `.env.example`
Tất cả các thông tin nhạy cảm được đưa vào tệp `.env`:
```env
# Application Host Port
PORT=8080

# Database Configuration
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=secretpassword
```

Tệp mẫu `.env.example` được dùng làm bản mẫu khi clone dự án:
```env
# Application Host Port
PORT=8080

# Database Configuration
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### 3.2. Cấu hình `docker-compose.yml`
```yaml
services:
  database:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend-net

  backend:
    build: .
    ports:
      - "${PORT}:8080"
    environment:
      DB_HOST: database
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - database
    networks:
      - backend-net

volumes:
  pgdata:

networks:
  backend-net:
```

### 3.3. Giải thích các chỉ thị quan trọng
- **`services`**: Khai báo 2 dịch vụ độc lập:
  - `database`: Chạy image `postgres:15-alpine`, ánh xạ thư mục dữ liệu với volume `pgdata`, kết nối vào mạng `backend-net`.
  - `backend`: Tự động build từ `Dockerfile` tại thư mục hiện tại (`build: .`), ánh xạ cổng `${PORT}:8080`, tham gia cùng mạng `backend-net`.
- **`depends_on`**: Khai báo dịch vụ `backend` phụ thuộc vào `database`, đảm bảo Docker Compose khởi chạy container `database` trước `backend`.
- **`networks` (Root level)**: Khởi tạo custom bridge network `backend-net` để các container có thể giải mã DNS nội bộ thông qua tên service (`database`).
- **`volumes` (Root level)**: Khởi tạo named volume `pgdata` lưu trữ dữ liệu bền vững của PostgreSQL, độc lập với vòng đời của container.

---

## 4. Các lệnh kiểm tra với Docker Compose CLI v2

Toàn bộ thao tác thực hiện thông qua chuẩn Docker Compose CLI v2:

### Bước 1: Khởi tạo và chạy toàn bộ dịch vụ ngầm (Background)
```bash
docker compose up -d
```
*Kết quả:* Docker Compose tự động tạo mạng `backend-net`, volume `pgdata`, build image cho backend (nếu chưa có) và khởi động cả 2 container lên trạng thái `Running`.

### Bước 2: Kiểm tra trạng thái các dịch vụ
```bash
docker compose ps
```
*Kết quả:* Cả hai service `backend` và `database` đều có trạng thái `Up` (Running), hiển thị đúng port mapping.

### Bước 3: Xem logs hoạt động thời gian thực
```bash
docker compose logs -f
```
*(Nhấn Ctrl+C để thoát khỏi chế độ theo dõi logs).*

### Bước 4: Kiểm tra kết nối API Backend
```bash
curl -i http://localhost:8080/
```
*Kết quả:* Nhận phản hồi HTTP `200 OK` và dữ liệu JSON thông báo kết nối thành công.

### Bước 5: Dừng và thu hồi tài nguyên
- Dừng và gỡ bỏ các container, network:
  ```bash
  docker compose down
  ```
- Nếu muốn xóa luôn volume lưu trữ dữ liệu:
  ```bash
  docker compose down -v
  ```

---

## 5. Hướng dẫn nộp bài
- **Đường dẫn thư mục trên GitHub:** `homework/session_10/ex5/`
- **Các tệp nộp:**
  - `docker-compose.yml`
  - `.env.example`
  - `.gitignore`
  - `README.md`
  - *(Kèm mã nguồn `Dockerfile`, `package.json`, `server.js` để đảm bảo hệ thống có thể build và chạy độc lập).*
