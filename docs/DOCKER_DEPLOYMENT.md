# مستندات Docker و Deployment - Telecom Marketplace

## مقدمه
این مستندات نحوه Dockerize کردن و Deployment پروژه Telecom Marketplace را شرح میدهد. این پروژه از **Docker Compose** برای مدیریت کانتینرها استفاده میکند و شامل دو محیط Development و Production میباشد.

---

## جدول محتوا
1. [معماری Docker](#معماری-docker)
2. [پیکربندی Docker](#پیکربندی-docker)
3. [Dockerfiles](#dockerfiles)
4. [Docker Compose](#docker-compose)
5. [متغیرهای محیطی (Environment Variables)](#متغیرهای-محیطی)
6. [راهاندازی در محیط Development](#راهاندازی-در-محیط-development)
7. [راهاندازی در محیط Production](#راهاندازی-در-محیط-production)
8. [دستورات مفید Docker](#دستورات-مفید-docker)
9. [عیبیابی (Troubleshooting)](#عیبیابی)
10. [بهروزرسانی و نگهداری](#بهروزرسانی-و-نگهداری)
11. [امنیت](#امنیت)
12. [Backup و Restore](#backup-و-restore)

---

## معماری Docker

### ساختار کانتینرها
```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│  │  PostgreSQL  │    │   Backend   │    │    Frontend      │   │
│  │  (postgres)  │◄───►│  (Fastify)  │◄───►│   (Next.js)      │   │
│  └─────────────┘    └─────────────┘    └─────────────────┘   │
│       ▲                  ▲ 3000              ▲ 3001            │
│       │                  │                  │                  │
│   5432 │              3000 │              3001 │                  │
└───────┼──────────────────┼──────────────────┼──────────────────┘
        │                  │                  │
    Host Ports:        5432              3000              3001
```

### پورتهای استفاده شده
| سرویس | پورت داخلی | پورت خارجی | توضیح |
|--------|------------|------------|--------|
| PostgreSQL | 5432 | 5432 | پایگاه داده |
| Backend | 3000 | 3000 | API Server (Fastify) |
| Frontend | 3001 | 3001 | Web Server (Next.js) |

### شبکه Docker
- **نام شبکه**: `telecom_net`
- **نوع**: Bridge
- تمام کانتینرها در این شبکه قرار دارند و میتوانند با هم ارتباط برقرار کنند

---

## پیکربندی Docker

### پیشنیازها
1. **Docker Desktop** (برای ویندوز/مک) یا **Docker Engine** (برای لینوکس)
2. **Docker Compose** نسخه 1.29 یا بالاتر
3. **Git** برای کلون کردن پروژه
4. حداقل **4GB RAM** و **2 CPU Core** برای توسعه

### بررسی نصب Docker
```bash
# بررسی نسخه Docker
docker --version

# بررسی نسخه Docker Compose
docker-compose --version

# بررسی وضعیت Docker
docker info
```

---

## Dockerfiles

### 1. Backend Dockerfile (Production)
**فایل**: `backend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# کپی فایلهای وابستگی
COPY package*.json ./
RUN npm ci --only=production

# کپی سورس کد
COPY . .

# Build پروژه
RUN npm run build

# Stage 2: Run
FROM node:18-alpine

WORKDIR /app

# کپی وابستگیها از stage قبلی
COPY --from=builder /app/node_modules ./node_modules

# کپی فایلهای build شده
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# نصب Prisma Client
RUN npm install prisma

# ایجاد کاربر غیر root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# در معرض قرار دادن پورت
EXPOSE 3000

# دستور اجرا
CMD ["node", "dist/server.js"]
```

**توضیحات**:
- از **Multi-stage build** برای کاهش حجم تصویر استفاده میشود
- وابستگیها در stage اول نصب میشوند
- در stage دوم فقط فایلهای ضروری کپی میشوند
- از کاربر غیر root برای امنیت استفاده میشود

---

### 2. Backend Dockerfile (Development)
**فایل**: `backend/Dockerfile.dev`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# کپی فایلهای وابستگی
COPY package*.json ./
RUN npm install

# کپی سورس کد
COPY . .

# نصب Prisma Client
RUN npm install prisma

# ایجاد کاربر غیر root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# در معرض قرار دادن پورت
EXPOSE 3000

# دستور اجرا با hot reload
CMD ["npm", "run", "dev"]
```

**توضیحات**:
- تمام فایلها کپی میشوند
- از `npm run dev` برای hot reload استفاده میشود
- سورس کد به عنوان volume mount میشود (در docker-compose.dev.yml)

---

### 3. Frontend Dockerfile (Production)
**فایل**: `frontend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# کپی فایلهای وابستگی
COPY package*.json ./
RUN npm ci

# کپی سورس کد
COPY . .

# Build پروژه Next.js
RUN npm run build

# Stage 2: Run
FROM node:18-alpine

WORKDIR /app

# کپی وابستگیها از stage قبلی
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# ایجاد کاربر غیر root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# در معرض قرار دادن پورت
EXPOSE 3001

# دستور اجرا
CMD ["npm", "start"]
```

**توضیحات**:
- از **Multi-stage build** استفاده میشود
- پروژه Next.js build میشود
- در stage دوم فقط فایلهای ضروری کپی میشوند

---
### 4. Frontend Dockerfile (Development)
**فایل**: `frontend/Dockerfile.dev`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# کپی فایلهای وابستگی
COPY package*.json ./
RUN npm install

# کپی سورس کد
COPY . .

# ایجاد کاربر غیر root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# در معرض قرار دادن پورت
EXPOSE 3001

# دستور اجرا با hot reload
CMD ["npm", "run", "dev"]
```

**توضیحات**:
- تمام فایلها کپی میشوند
- از `npm run dev` برای hot reload استفاده میشود
- سورس کد به عنوان volume mount میشود (در docker-compose.dev.yml)

---

## Docker Compose

### 1. docker-compose.yml (Production)
**فایل**: `docker-compose.yml`

```yaml
version: '3.9'

services:
  # PostgreSQL
  postgres:
    image: postgres:16-bookworm
    container_name: telecom_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-telecom}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-telecom_pass}
      POSTGRES_DB: ${POSTGRES_DB:-telecom_marketplace}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - telecom_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-telecom} -d ${POSTGRES_DB:-telecom_marketplace}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: telecom_backend
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-telecom}:${POSTGRES_PASSWORD:-telecom_pass}@postgres:5432/${POSTGRES_DB:-telecom_marketplace}?schema=public
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - telecom_net

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: telecom_frontend
    restart: unless-stopped
    env_file:
      - ./frontend/.env.local
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3000/api
    ports:
      - "3001:3001"
    depends_on:
      - backend
    networks:
      - telecom_net

networks:
  telecom_net:
    driver: bridge

volumes:
  postgres_data:
```

**ویژگیها**:
- استفاده از **healthcheck** برای PostgreSQL
- **depends_on** برای اطمینان از آماده بودن سرویسها
- **volumes** برای ذخیره دائمی دادههای پایگاه داده
- **networks** برای ارتباط بین کانتینرها

---
### 2. docker-compose.dev.yml (Development)
**فایل**: `docker-compose.dev.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-bookworm
    container_name: telecom_db_dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: telecom
      POSTGRES_PASSWORD: telecom_pass
      POSTGRES_DB: telecom_marketplace
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - telecom_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U telecom -d telecom_marketplace"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: telecom_backend_dev
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      DATABASE_URL: postgresql://telecom:telecom_pass@postgres:5432/telecom_marketplace?schema=public
      NODE_ENV: development
    ports:
      - "3000:3000"
    volumes:
      # سورس کد را mount میکند تا hot reload فعال باشد
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - telecom_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: telecom_frontend_dev
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
    ports:
      - "3001:3001"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    networks:
      - telecom_net

networks:
  telecom_net:
    driver: bridge

volumes:
  postgres_data_dev:
```

**تفاوتها با Production**:
- استفاده از **volumes** برای hot reload
- متغیرهای محیطی سادهتر
- پورت API به `localhost` اشاره میکند (برای دسترسی از مرورگر)

---

## متغیرهای محیطی (Environment Variables)

### 1. Backend Environment Variables
**فایل**: `backend/.env.example`

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# Log Level
LOG_LEVEL=debug
```

**توضیحات**:
- `DATABASE_URL`: آدرس اتصال به پایگاه داده
- `JWT_SECRET`: کلید مخفی برای امضای توکنها
- `JWT_ACCESS_EXPIRES_IN`: مدت اعتبار توکن دسترسی
- `JWT_REFRESH_EXPIRES_IN`: مدت اعتبار توکن تازهسازی
- `FRONTEND_URL`: آدرس frontend برای تنظیم CORS

---
### 2. Frontend Environment Variables
**فایل**: `frontend/.env.local.example`

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**توضیحات**:
- `NEXT_PUBLIC_API_URL`: آدرس API backend
- `NEXT_PUBLIC_APP_URL`: آدرس اپلیکیشن frontend

**نکته**: متغیرهای محیطی که با `NEXT_PUBLIC_` شروع میشوند، در سمت کلاینت قابل دسترسی هستند.

---
### 3. Docker Environment Variables
**فایل**: `.env` (در ریشه پروژه)

```env
# PostgreSQL
POSTGRES_USER=telecom
POSTGRES_PASSWORD=telecom_pass
POSTGRES_DB=telecom_marketplace
```

**توضیحات**:
- این متغیرها در docker-compose.yml استفاده میشوند
- میتوانید مقادیر پیشفرض را override کنید

---
## راهاندازی در محیط Development

### گام به گام

1. **کلون کردن پروژه**
```bash
git clone <repo-url>
cd telecom-marketplace
```

2. **ایجاد فایلهای .env**
```bash
# ویندوز
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
copy .env.example .env

# لینوکس/مک
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
cp .env.example .env
```

3. **ویرایش فایلهای .env**
- مقادیر مناسب را برای متغیرهای محیطی تنظیم کنید
- حداقل `JWT_SECRET` را تغییر دهید

4. **راهاندازی کانتینرها**
```bash
docker compose -f docker-compose.dev.yml up -d
```

5. **نصب وابستگیها (اگر لازم باشد)**
```bash
docker compose -f docker-compose.dev.yml exec backend npm install
docker compose -f docker-compose.dev.yml exec frontend npm install
```

6. **اجرای Migrationهای پایگاه داده**
```bash
docker exec telecom_backend_dev npx prisma migrate dev
```

7. **Seed کردن دادههای اولیه**
```bash
docker exec telecom_backend_dev node prisma/seed.js
```

8. **مشاهده لاگها**
```bash
docker compose -f docker-compose.dev.yml logs -f
```

9. **دسترسی به اپلیکیشن**
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Prisma Studio**: http://localhost:5555 (بعد از اجرا)

---
### دستورات مفید برای Development

**مشاهده لاگهای backend**
```bash
docker compose -f docker-compose.dev.yml logs -f backend
```

**مشاهده لاگهای frontend**
```bash
docker compose -f docker-compose.dev.yml logs -f frontend
```

**باز کردن shell در backend**
```bash
docker exec -it telecom_backend_dev sh
```

**باز کردن shell در frontend**
```bash
docker exec -it telecom_frontend_dev sh
```

**اجرای Prisma Studio**
```bash
docker exec -it telecom_backend_dev npx prisma studio
```

**توقف کانتینرها**
```bash
docker compose -f docker-compose.dev.yml down
```

**توقف و حذف کانتینرها و volumes**
```bash
docker compose -f docker-compose.dev.yml down -v
```

---
## راهاندازی در محیط Production

### پیشنیازها
1. سرور با حداقل **4GB RAM** و **2 CPU Core**
2. Docker و Docker Compose نصب شده
3. دامنه و SSL Certificate (برای HTTPS)

### گام به گام

1. **کلون کردن پروژه**
```bash
git clone <repo-url>
cd telecom-marketplace
```

2. **ایجاد فایلهای .env**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
cp .env.example .env
```

3. **تنظیم متغیرهای محیطی**
- `JWT_SECRET` را به یک کلید مخفی و قوی تغییر دهید
- `DATABASE_URL` را تنظیم کنید
- `FRONTEND_URL` را به آدرس دامنه خود تنظیم کنید
- `NEXT_PUBLIC_API_URL` را به آدرس دامنه backend تنظیم کنید

4. **Build و راهاندازی کانتینرها**
```bash
docker compose up -d --build
```

5. **اجرای Migrationهای پایگاه داده**
```bash
docker exec telecom_backend npx prisma migrate deploy
```

6. **Seed کردن دادههای اولیه**
```bash
docker exec telecom_backend node prisma/seed.js
```

7. **مشاهده وضعیت کانتینرها**
```bash
docker compose ps
```

8. **دسترسی به اپلیکیشن**
- **Frontend**: http://your-domain.com:3001
- **Backend API**: http://your-domain.com:3000/api

---
### تنظیم Reverse Proxy (Nginx)

برای استفاده از HTTPS و یک پورت واحد، میتوانید از Nginx به عنوان Reverse Proxy استفاده کنید.

**فایل**: `nginx.conf`
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Docker Compose با Nginx**
```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: telecom_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - telecom_net
```

---
## دستورات مفید Docker

### مدیریت کانتینرها
```bash
# لیست کانتینرهای در حال اجرا
docker ps

# لیست تمام کانتینرها (شامل متوقف شده)
docker ps -a

# توقف کانتینر
docker stop <container_name>

# شروع کانتینر
docker start <container_name>

# restart کانتینر
docker restart <container_name>

# حذف کانتینر
docker rm <container_name>

# حذف تمام کانتینرهای متوقف شده
docker container prune
```

---
### مدیریت Images
```bash
# لیست images
docker images

# حذف image
docker rmi <image_id>

# حذف تمام images استفاده نشده
docker image prune -a
```

---
### مدیریت Volumes
```bash
# لیست volumes
docker volume ls

# حذف volume
docker volume rm <volume_name>

# حذف تمام volumes استفاده نشده
docker volume prune
```

---
### مدیریت شبکه
```bash
# لیست شبکهها
docker network ls

# حذف شبکه
docker network rm <network_name>

# بررسی اتصال شبکه
docker network inspect <network_name>
```

---
### Build و Push Images
```bash
# Build image
docker build -t telecom-backend -f backend/Dockerfile .

# Tag کردن image
docker tag telecom-backend your-registry/telecom-backend:v1

# Push به registry
docker push your-registry/telecom-backend:v1

# Pull از registry
docker pull your-registry/telecom-backend:v1
```

---
## عیبیابی (Troubleshooting)

### 1. مشکل: کانتینرها شروع نمیشوند
**علت**: پورت در حال استفاده است
**راهحل**:
```bash
# پیدا کردن فرآیند استفاده کننده از پورت
sudo lsof -i :3000

# کشتن فرآیند
kill -9 <PID>
```

---
### 2. مشکل: اتصال به پایگاه داده شکست میخورد
**علت**: پایگاه داده هنوز آماده نیست
**راهحل**:
- از healthcheck در docker-compose استفاده کنید
- منتظر بمانید تا پایگاه داده کاملا راهاندازی شود
- لاگهای postgres را بررسی کنید:
```bash
docker logs telecom_db
```

---
### 3. مشکل: Migrationها اجرا نمیشوند
**علت**: عدم دسترسی به پایگاه داده
**راهحل**:
- مطمئن شوید `DATABASE_URL` در فایل .env backend صحیح است
- در docker-compose، از نام سرویس postgres به عنوان host استفاده کنید:
```env
DATABASE_URL=postgresql://telecom:telecom_pass@postgres:5432/telecom_marketplace?schema=public
```

---
### 4. مشکل: Frontend به API متصل نمیشود
**علت**: مشکل CORS یا آدرس اشتباه
**راهحل**:
- در backend، مطمئن شوید CORS تنظیم شده است:
```javascript
// در app.js
await app.register(require('@fastify/cors'), {
  origin: nodeEnv === 'production' ? [frontendUrl] : true,
  credentials: true,
});
```
- در frontend، مطمئن شوید `NEXT_PUBLIC_API_URL` صحیح است

---
### 5. مشکل: Hot reload در development کار نمیکند
**علت**: volumes به درستی تنظیم نشدهاند
**راهحل**:
- در docker-compose.dev.yml، مطمئن شوید volumes به درستی تنظیم شدهاند:
```yaml
volumes:
  - ./backend/src:/app/src
  - ./backend/prisma:/app/prisma
```
- کانتینرها را restart کنید:
```bash
docker compose -f docker-compose.dev.yml restart
```

---
### 6. مشکل: حافظه کافی نیست
**علت**: Docker حافظه کافی ندارد
**راهحل**:
- در Docker Desktop، حافظه را افزایش دهید
- یا از فایل swap استفاده کنید:
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---
### 7. مشکل: پورت 5432 در macOS در دسترس نیست
**راهحل**:
- پورت را تغییر دهید:
```yaml
ports:
  - "5433:5432"
```
- و در `DATABASE_URL` پورت را به روز کنید:
```env
DATABASE_URL=postgresql://telecom:telecom_pass@postgres:5433/telecom_marketplace?schema=public
```

---
## بهروزرسانی و نگهداری

### بهروزرسانی کد
1. کد را pull کنید:
```bash
git pull origin main
```

2. کانتینرها را rebuild کنید:
```bash
docker compose up -d --build
```

3. Migrationهای جدید را اجرا کنید:
```bash
docker exec telecom_backend npx prisma migrate deploy
```

---
### بهروزرسانی وابستگیها
1. فایلهای package.json را به روز کنید
2. کانتینرها را rebuild کنید:
```bash
docker compose up -d --build --no-cache
```

---
### بهروزرسانی Docker Images
1. images جدید را pull کنید:
```bash
docker compose pull
```

2. کانتینرها را rebuild کنید:
```bash
docker compose up -d --build
```

---
### پاکسازی سیستم
```bash
# حذف کانتینرهای متوقف شده
docker container prune

# حذف images استفاده نشده
docker image prune -a

# حذف volumes استفاده نشده
docker volume prune

# حذف شبکههای استفاده نشده
docker network prune

# پاکسازی کامل (احتیاط!)
docker system prune -a --volumes
```

---
## امنیت

### بهترین شیوههای امنیتی

1. **کلیدهای مخفی**:
   - هرگز کلیدهای مخفی را در کد ذخیره نکنید
   - از متغیرهای محیطی استفاده کنید
   - فایلهای .env را در git ignore کنید

2. **دسترسی به Docker**:
   - Docker را با حقوق کاربر غیر root اجرا کنید
   - از Docker rootless استفاده کنید

3. **شبکه**:
   - پورتهای غیرضروری را در معرض قرار ندهید
   - از firewall استفاده کنید

4. **پایگاه داده**:
   - از رمز عبور قوی استفاده کنید
   - دسترسی از خارج را محدود کنید

5. **HTTPS**:
   - همیشه از HTTPS در production استفاده کنید
   - از Let's Encrypt برای گواهینامه رایگان استفاده کنید

---
### تنظیم HTTPS با Let's Encrypt
1. Nginx را با Certbot تنظیم کنید:
```bash
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  certbot/certbot certonly --webroot -w /var/lib/letsencrypt -d your-domain.com
```

2. فایل nginx.conf را به روز کنید:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... بقیه تنظیمات
}
```

---
## Backup و Restore

### Backup پایگاه داده
```bash
# Backup با pg_dump
docker exec telecom_db pg_dump -U telecom -d telecom_marketplace > backup.sql

# Backup با docker volume
docker run --rm -v postgres_data:/volume -v $(pwd):/backup alpine \
  tar cvf /backup/postgres_backup.tar /volume
```

---
### Restore پایگاه داده
```bash
# Restore با psql
cat backup.sql | docker exec -i telecom_db psql -U telecom -d telecom_marketplace

# Restore با docker volume
docker run --rm -v postgres_data:/volume -v $(pwd):/backup alpine \
  tar xvf /backup/postgres_backup.tar -C /
```

---
### Backup خودکار
برای backup خودکار میتوانید از cron job استفاده کنید:
```bash
# هر روز ساعت 2 بامداد
0 2 * * * docker exec telecom_db pg_dump -U telecom -d telecom_marketplace > /backups/telecom_$(date +\%Y-\%m-\%d).sql
```

---
### ذخیره Backupها در فضای ابری
```bash
# آپلود به AWS S3
aws s3 cp backup.sql s3://your-bucket-name/backups/telecom_$(date +%Y-%m-%d).sql

# آپلود به Google Drive
# از rclone استفاده کنید
rclone copy backup.sql remote:backups/
```

---
## منابع
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)