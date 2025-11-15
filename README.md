# 🧙‍♀️ Yiyecek Çarkı - Cadının Çarkı

Docker-uyumlu, kod tabanlı şans oyunu uygulaması. Kullanıcılar benzersiz kodlarla çarkı çevirip ödül kazanabilir. Admin paneli ile yiyecekleri, oranları ve kodları kolayca yönetin.

## ✨ Özellikler

### 🎯 Çark Uygulaması
- **Kod Tabanlı Çevirme**: Her kod yalnızca bir kez kullanılabilir
- **URL Parametresi Desteği**: `/?code=abc123xyz` şeklinde direkt linkler
- **Dinamik Yiyecek Yükleme**: API'den çekilen yiyecekler ve oranlar
- **Ağırlıklı Rastgele Seçim**: Her yiyeceğin farklı kazanma oranı
- **Animasyonlu Çark**: Gerçekçi deselasyon ve görsel efektler
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu

### 🔧 Admin Paneli
- **Yiyecek Yönetimi**: Ekle, düzenle, sil, renk seç
- **Oran Kontrolü**: Otomatik %100 toplamı kontrolü
- **Kod Oluşturma**: Kampanya adıyla benzersiz kodlar
- **Link Paylaşımı**: Tek tıkla kopyalanabilir linkler
- **Detaylı İstatistikler**: Kullanım sayıları, en çok kazanan ödüller
- **Çevirme Geçmişi**: Her kod için detaylı geçmiş (tarih, ödül, IP)
- **Kod İsim Düzenleme**: Kampanyaları kolayca takip edin

### 🔒 Güvenlik
- **Şifre Korumalı Admin**: Environment variable ile yapılandırma
- **Rate Limiting**: IP bazlı istek sınırlama
- **CORS Yapılandırması**: Güvenli origin kontrolü
- **Helmet.js**: HTTP güvenlik başlıkları
- **Input Sanitization**: XSS koruması

## 📦 Kurulum

### Docker ile Kurulum (Önerilen)

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd yiyecek-carki
```

2. **Environment dosyasını oluşturun**
```bash
cp .env.example .env
```

3. **.env dosyasını düzenleyin**
```env
PORT=3000
ADMIN_PASSWORD=güvenli_şifreniz_buraya
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
CORS_ORIGINS=*
```

4. **Docker Compose ile başlatın**
```bash
docker-compose up -d
```

5. **Uygulamaya erişin**
- Çark: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

### Manuel Kurulum

1. **Bağımlılıkları yükleyin**
```bash
npm install
```

2. **.env dosyasını oluşturun**
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

3. **Uygulamayı başlatın**
```bash
npm start
```

Veya development modu için:
```bash
npm run dev
```

## 🎮 Kullanım

### Admin Paneli İşlemleri

#### 1. İlk Giriş
1. http://localhost:3000/admin adresine gidin
2. `.env` dosyasındaki şifreyi girin

#### 2. Yiyecekleri Ayarlama
1. **Yiyecekler** sekmesine tıklayın
2. **+ Yiyecek Ekle** butonuna basın
3. İsim, oran (%) ve renk seçin
4. **Toplam oran %100 olmalıdır**
5. **Değişiklikleri Kaydet** butonuna basın

#### 3. Kod Oluşturma
1. **Kodlar** sekmesine tıklayın
2. **+ Yeni Kod Oluştur** butonuna basın
3. Kampanya adı girin (opsiyonel)
4. Otomatik 12 haneli kod üretilir
5. Linki kopyalayıp paylaşın

#### 4. Link Paylaşımı
- Her kod için otomatik link: `http://localhost:3000/?code=abc123xyz456`
- **Kopyala** butonu ile tek tıkla kopyalama
- WhatsApp, sosyal medya, e-posta ile paylaşabilirsiniz

#### 5. Kod Detayları
- **Detaylar** butonuna basarak:
  - Kullanım durumu
  - Çevirme geçmişi
  - Kazanılan ödüller
  - IP adresleri ve tarihler

### Kullanıcı İşlemleri

#### Yöntem 1: Direkt Link
1. Admin panelden alınan linke tıklayın
2. Kod otomatik dolar
3. **ÇEVİR** butonuna basın
4. Ödülünüzü görün!

#### Yöntem 2: Manuel Giriş
1. Ana sayfaya gidin
2. 12 haneli kodu girin
3. Kod geçerli ise buton aktif olur
4. **ÇEVİR** butonuna basın

## 📁 Proje Yapısı

```
yiyecek-carki/
├── server.js                 # Express backend
├── package.json              # Node.js dependencies
├── Dockerfile               # Docker image tanımı
├── docker-compose.yml       # Docker Compose yapılandırması
├── .env.example             # Environment variables şablonu
├── .gitignore               # Git ignore kuralları
├── .dockerignore            # Docker ignore kuralları
├── data/                    # JSON veri dosyaları
│   ├── .gitkeep
│   ├── foods.json.example   # Yiyecekler şablonu
│   └── codes.json.example   # Kodlar şablonu
└── public/                  # Frontend dosyaları
    ├── index.html           # Çark sayfası
    ├── script.js            # Çark JavaScript
    ├── styles.css           # Çark CSS
    └── admin/               # Admin panel
        ├── index.html       # Admin HTML
        ├── admin.js         # Admin JavaScript
        └── admin.css        # Admin CSS
```

## 🔧 Yapılandırma

### Environment Variables

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `PORT` | Sunucu portu | `3000` |
| `ADMIN_PASSWORD` | Admin panel şifresi | `admin123` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit penceresi (ms) | `900000` (15dk) |
| `RATE_LIMIT_MAX_REQUESTS` | Maksimum istek sayısı | `10` |
| `CORS_ORIGINS` | İzin verilen originler | `*` |

### Docker Compose Özelleştirme

Port değiştirme:
```yaml
ports:
  - "8080:3000"  # Host:Container
```

Admin şifresi değiştirme:
```yaml
environment:
  - ADMIN_PASSWORD=super_gizli_sifre
```

## 🗂️ Veri Yapıları

### foods.json
```json
{
  "foods": [
    {
      "id": "food_1",
      "name": "Frambuazlı Biscolata",
      "weight": 12,
      "color": "#FF6B9D"
    }
  ],
  "totalWeight": 100,
  "lastUpdated": "2025-11-15T14:30:00Z"
}
```

### codes.json
```json
{
  "codes": [
    {
      "code": "abc123xyz456",
      "name": "Sosyal Medya Kampanyası",
      "createdAt": "2025-11-15T14:00:00Z",
      "maxSpins": 1,
      "usedCount": 0,
      "spins": []
    }
  ]
}
```

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/foods` - Yiyecek listesi
- `GET /api/validate-code/:code` - Kod geçerliliği
- `POST /api/spin` - Çarkı çevir

### Admin Endpoints
- `POST /api/admin/auth` - Admin girişi
- `GET /api/admin/foods` - Yiyecekleri getir
- `PUT /api/admin/foods` - Yiyecekleri güncelle
- `GET /api/admin/codes` - Kodları getir
- `POST /api/admin/codes/generate` - Yeni kod oluştur
- `PUT /api/admin/codes/:code` - Kod adını güncelle
- `DELETE /api/admin/codes/:code` - Kodu sil
- `GET /api/admin/stats` - İstatistikler

## 🚀 Production Deployment

### Docker ile Deploy

1. **Image oluşturun**
```bash
docker build -t yiyecek-carki:latest .
```

2. **Container'ı başlatın**
```bash
docker run -d \
  --name yiyecek-carki \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e ADMIN_PASSWORD=güvenli_şifre \
  --restart unless-stopped \
  yiyecek-carki:latest
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛠️ Geliştirme

### Yeni Özellik Ekleme

1. Backend değişiklikleri için `server.js` dosyasını düzenleyin
2. Frontend için `public/` klasöründeki ilgili dosyaları güncelleyin
3. Docker image'ı yeniden build edin

### Debug Modu

```bash
NODE_ENV=development npm run dev
```

## 🐛 Sorun Giderme

### Container başlamıyor
```bash
# Logları kontrol edin
docker-compose logs yiyecek-carki

# Container'ı yeniden başlatın
docker-compose restart
```

### Port zaten kullanımda
```bash
# .env veya docker-compose.yml'de portu değiştirin
PORT=8080
```

### JSON dosyaları kayboldu
```bash
# Volume'ü kontrol edin
docker volume inspect yiyecek-carki_data

# Backup'tan geri yükleyin
cp backup/data/*.json data/
```

## 📝 Lisans

MIT License - Özgürce kullanabilir ve değiştirebilirsiniz.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Production ortamında mutlaka güçlü bir admin şifresi kullanın ve HTTPS ile deploy edin!
