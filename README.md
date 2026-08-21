# Shadowdark Manager — Etap 1B

Aplikacja webowa do zarządzania kampaniami, drużyną, ekwipunkiem i zasobami w Shadowdark RPG.

## Co działa w Etapie 1B

- styl A: ciemny interfejs fantasy z pergaminowo-złotymi akcentami,
- wiele kampanii,
- tryb lokalny bez backendu,
- Supabase Auth: rejestracja i logowanie e-mail + hasło,
- kampanie przechowywane w Supabase po zalogowaniu,
- kod dołączenia do kampanii,
- role kampanii: owner / gm / player,
- RLS zabezpieczający dostęp do kampanii,
- Realtime dla zmian kampanii i członkostwa,
- przygotowanie pod GitHub Pages,
- dashboard będący podstawą kolejnych etapów.

## 1. Uruchomienie lokalne

Wymagany Node.js 20+.

```bash
npm install
npm run dev
```

Bez `.env` aplikacja działa w trybie lokalnym/demo.

## 2. Konfiguracja Supabase

1. Utwórz projekt w Supabase.
2. Otwórz **SQL Editor**.
3. Wklej i uruchom cały plik `supabase-schema.sql`.
4. W ustawieniach projektu skopiuj Project URL i **publishable key**.
5. Skopiuj `.env.example` do `.env` i wpisz dane:

```env
VITE_SUPABASE_URL=https://TWOJ-PROJEKT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TUTAJ_KLUCZ
```

Nigdy nie umieszczaj w frontendzie `service_role` ani secret key.

### Auth / potwierdzanie e-mail

Jeśli w Supabase włączone jest potwierdzanie adresu e-mail, po rejestracji użytkownik musi kliknąć link potwierdzający. W **Authentication → URL Configuration** ustaw `Site URL` na adres opublikowanej aplikacji GitHub Pages, np. `https://uzytkownik.github.io/shadowdark-manager/`, i dodaj ten sam adres do dozwolonych Redirect URLs. Do szybkich testów możesz odpowiednio skonfigurować potwierdzanie e-mail w ustawieniach Auth projektu.

## 3. GitHub Pages

Repozytorium zawiera `.github/workflows/deploy.yml`. Po wypchnięciu kodu:

1. GitHub → **Settings → Pages**.
2. W `Build and deployment` wybierz **GitHub Actions**.
3. Dodaj w repozytorium **Settings → Secrets and variables → Actions → Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Ponownie uruchom workflow lub zrób commit.

`vite.config.ts` wylicza bazową ścieżkę na GitHub Actions z nazwy repozytorium, więc projekt może działać pod `https://uzytkownik.github.io/nazwa-repo/`.

## 4. Jak działa wspólna kampania

Właściciel tworzy kampanię. Aplikacja generuje kod dołączenia. Drugi użytkownik loguje się, wybiera **Dołącz kodem**, wpisuje kod i zostaje członkiem kampanii. Zmiany listy kampanii i członkostwa są subskrybowane przez Supabase Realtime.

W kolejnych etapach ten sam model `campaign_id + RLS + Realtime` będzie użyty dla postaci, przedmiotów, światła, prowiantu i złota.

## 5. Build test

```bash
npm run build
```

Wynik trafia do katalogu `dist/`.
