# Shadowdark Manager

Pierwszy etap menadżera ekwipunku i drużyny do Shadowdark RPG.

## Co już działa

- interfejs w stylu klasycznego RPG / pergaminu,
- responsywny dashboard,
- wiele kampanii w trybie lokalnym,
- tworzenie i przełączanie kampanii,
- przygotowane widoki zasobów, światła, prowiantu, złota i slotów,
- gotowa konfiguracja pod Supabase,
- gotowy workflow GitHub Pages.

## Uruchomienie lokalne

Wymagany Node.js 20+ (zalecany 22).

```bash
npm install
npm run dev
```

## Supabase

1. Utwórz projekt w Supabase.
2. W SQL Editor uruchom `supabase-schema.sql`.
3. Skopiuj `.env.example` do `.env.local`.
4. Uzupełnij:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Na tym etapie obecność zmiennych przełącza oznaczenie interfejsu na tryb Supabase. Faktyczne logowanie i pobieranie kampanii z bazy dodamy w następnym kroku Etapu 1.

## GitHub Pages

Repozytorium zawiera `.github/workflows/deploy.yml`.

W GitHub:

1. `Settings -> Pages`
2. w `Build and deployment` ustaw `Source: GitHub Actions`,
3. w `Settings -> Secrets and variables -> Actions` dodaj:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. push na gałąź `main` uruchomi wdrożenie.

Vite używa względnej ścieżki bazowej (`./`), dzięki czemu build działa zarówno pod domeną główną, jak i pod `/NAZWA-REPOZYTORIUM/` na GitHub Pages.

## Status projektu

Etap 1A: **gotowy** — szkielet aplikacji i dashboard.

Następny krok: **Etap 1B — logowanie Supabase, rzeczywiste kampanie w bazie, członkostwo użytkowników i synchronizacja kampanii.**
