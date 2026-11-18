# Topsell Admin Dashboard

Dashboard pengelolaan penjualan dan konfigurasi checkout untuk **Topsell Belanja** (Next.js 16 + BoardUI).

## Menjalankan Lokal

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3001` (pastikan `topsell-local-api` berjalan di `http://localhost:8080`).

## Environment Variables

- `API_URL`: URL backend API untuk rewrite `/backend/*` (contoh: `https://api-anda.vercel.app/api/v1/:path*`)
- `NEXT_PUBLIC_CHECKOUT_URL`: URL halaman checkout (contoh: `https://topsell-checkout.vercel.app`)
