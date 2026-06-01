# Trabajo Final de Grado — Speedrun's

Rediseño y ampliación de una aplicación web de seguimiento de speedruns, construida con Angular en el frontend y Django REST Framework en el backend. Consume la API pública de speedrun.com y añade un sistema de autenticación propio.

---

## Índice

1. [Tecnologías utilizadas](#tecnologías-utilizadas)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación y arranque](#instalación-y-arranque)
4. [Variables de entorno](#variables-de-entorno)
5. [Arquitectura del proyecto](#arquitectura-del-proyecto)
6. [Páginas del frontend](#páginas-del-frontend)
7. [Componentes compartidos](#componentes-compartidos)
8. [Funcionalidades](#funcionalidades)
9. [Llamadas a la API de speedrun.com](#llamadas-a-la-api-de-speedruncom)
10. [Base de datos](#base-de-datos)
11. [Internacionalización](#internacionalización)

---

## Tecnologías utilizadas

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 17+ | Framework principal |
| TypeScript | 5+ | Lenguaje base |
| RxJS | 7+ | Programación reactiva |
| @ngx-translate/core | — | Internacionalización (i18n) |
| lucide-angular | 0.383.0 | Iconos |
| CSS personalizado | — | Estilos con variables CSS |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.10+ | Lenguaje base |
| Django | 4+ | Framework web |
| Django REST Framework | 3+ | API REST |
| djangorestframework-simplejwt | — | Autenticación JWT |
| django-cors-headers | — | Gestión de CORS |
| SQLite | — | Base de datos de desarrollo |

---

## Requisitos previos

- Node.js 18+
- Python 3.10+
- Angular CLI (`npm install -g @angular/cli`)
- Entorno virtual Python (`venv`)

---

## Instalación y arranque

### Backend

```bash
# Acceder al directorio del backend
cd backend

# Activar el entorno virtual
source venv/bin/activate

# Instalar dependencias (primera vez)
pip install -r requirements.txt

# Aplicar migraciones (primera vez)
python manage.py migrate

# Arrancar el servidor
python manage.py runserver 8001
```

El backend quedará disponible en `http://localhost:8001`.

El panel de administración de Django está en `http://localhost:8001/admin` (requiere superusuario: `python manage.py createsuperuser`).

### Frontend

```bash
# Acceder al directorio del frontend
cd frontend

# Instalar dependencias (primera vez)
npm install

# Arrancar la aplicación
ng serve -o
```

La aplicación quedará disponible en `http://localhost:4200`.

---

## Variables de entorno

### Backend (`backend/speedrun_backend/settings.py`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `SECRET_KEY` | Clave secreta de Django | Definida en settings.py |
| `DEBUG` | Modo debug | `True` |
| `ALLOWED_HOSTS` | Hosts permitidos | `['*']` |
| `APPEND_SLASH` | Redirección automática con barra final | `False` |
| `CORS_ALLOW_ALL_ORIGINS` | Permite todas las origenes CORS | `True` |
| `AUTH_USER_MODEL` | Modelo de usuario personalizado | `users.User` |

### Frontend (`src/environments/`)

| Variable | Descripción |
|---|---|
| `apiUrl` | URL base del backend (`http://localhost:8001/api`) |

---

## Arquitectura del proyecto

```
TrabajoFinalGrado/
├── backend/
│   ├── speedrun_backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── users/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    └── src/
        └── app/
            ├── core/
            │   └── services/
            │       └── auth.ts
            ├── pages/
            │   ├── auth/
            │   │   ├── login/
            │   │   └── register/
            │   ├── game/
            │   │   ├── challenges/
            │   │   ├── game-details/
            │   │   ├── game-home/
            │   │   └── popular-games/
            │   ├── home/
            │   ├── not-found/
            │   ├── runs/
            │   └── user/
            │       ├── my-profile/
            │       └── user-profile/
            └── shared/
                ├── color-picker/
                ├── components/
                │   ├── challenges/
                │   ├── filters/
                │   │   ├── category-filters/
                │   │   ├── console-filter/
                │   │   └── order-filter/
                │   ├── footer/
                │   ├── game-leaderboard/
                │   ├── game-series/
                │   ├── loading-spinner/
                │   ├── navbar/
                │   └── profile/
                │       ├── user-about/
                │       ├── user-avatar/
                │       ├── user-full-game-runs/
                │       ├── user-info/
                │       ├── user-level-runs/
                │       └── user-tabs/
                └── pipes/
                    ├── format-time-pipe/
                    └── time-ago-pipe/
```

---

## Páginas del frontend

| Ruta | Componente | Descripción |
|---|---|---|
| `/home` | `HomeComponent` | Página de inicio |
| `/game` | `GameHomeComponent` | Catálogo de juegos y series con filtros |
| `/game/:id` | `GameDetailsComponent` | Detalle de juego con leaderboard |
| `/games/popular-games` | `PopularGamesComponent` | Carrusel de juegos populares |
| `/challenges` | `ChallengesComponent` | Listado de challenges con podio y top earners |
| `/user/:id` | `UserProfileComponent` | Perfil de usuario de speedrun.com |
| `/profile` | `MyProfileComponent` | Perfil propio del usuario registrado |
| `/login` | `LoginComponent` | Inicio de sesión |
| `/register` | `RegisterComponent` | Registro de usuario |
| `/**` | `NotFound` | Página 404 |

---

## Componentes compartidos

| Componente | Descripción |
|---|---|
| `app-navbar` | Barra de navegación con selector de idioma, modo daltónico y dropdown de usuario |
| `app-footer` | Footer con enlaces de speedrun.com |
| `app-game-leaderboard` | Tabla de clasificación con paginación, filtro de categorías y fallback |
| `app-category-filters` | Filtro de categorías per-game y per-level |
| `app-console-filter` | Filtro por plataforma/consola |
| `app-order-filter` | Filtro de ordenación con fallback automático |
| `app-user-info` | Cabecera del perfil de usuario (avatar, nombre, rol, redes) |
| `app-user-tabs` | Pestañas del perfil (Full Game Runs, Level Runs, About) |
| `app-user-avatar` | Avatar circular con inicial como fallback |
| `app-user-about` | Estadísticas del usuario (runs, tiempo total, juegos moderados) |
| `app-user-full-game-runs` | Tabla de runs de juego completo |
| `app-user-level-runs` | Tabla de runs por nivel |
| `app-color-picker` | Selector de color personalizado para el perfil |
| `app-top-earners` | Leaderboard global de ganancias en challenges |
| `app-loading-spinner` | Indicador de carga |

---

## Funcionalidades

### Autenticación
- Registro con username, email y contraseña
- Login con JWT almacenado en localStorage
- Logout reactivo con BehaviorSubject que actualiza la navbar en tiempo real
- Perfil propio con avatar generado a partir de la inicial del nombre

### Catálogo de juegos
- Listado paginado con filtros de plataforma y criterio de ordenación
- Búsqueda por nombre con debounce
- Ordenación por jugadores activos con fallback automático a "más recientes" si no hay datos
- Vista de series con búsqueda local
- Navegación al detalle del juego con scroll al top automático

### Juegos populares
- Carrusel de juegos ordenados por runs verificadas recientes
- Panel lateral con información del juego, stats y metadata del ruleset
- Leaderboard integrado con filtro de categorías y paginación
- Fallback descriptivo para juegos sin categorías directas

### Challenges
- Vista en tres tercios: reglas, podio central y top earners
- Podio animado con diferenciación visual por oro, plata y bronce
- Top earners global calculado sumando ganancias de todos los challenges
- Colores de nombre de usuario obtenidos de la API v1 de speedrun.com

### Perfil de usuario
- Perfil de usuarios de speedrun.com con avatar, rol, país y actividad
- Estadísticas completas: runs totales, tiempo acumulado, juegos únicos, juegos moderados
- Runs de juego completo y por nivel agrupadas por juego
- Perfil propio vacío para usuarios registrados localmente

### Accesibilidad y UX
- Modo daltónico con paleta alternativa persistida en localStorage
- Internacionalización completa en español, inglés y chino (ngx-translate)
- Fondo animado con efecto fluido mediante CSS puro (GPU-accelerated)
- Diseño responsive con breakpoints a 900px y 1400px

---

## Llamadas a la API de speedrun.com

La aplicación consume la API pública de speedrun.com v1 (`https://www.speedrun.com/api/v1`) y la v2 (`https://www.speedrun.com/api/v2`).

### API v1

| Endpoint | Uso |
|---|---|
| `GET /games` | Catálogo de juegos con filtros de plataforma, orden y búsqueda |
| `GET /games/:id/categories` | Categorías per-game y per-level de un juego |
| `GET /runs` | Runs recientes verificadas para jugadores activos y conteos |
| `GET /leaderboards/:gameId/category/:categoryId` | Leaderboard de una categoría con embed de jugadores |
| `GET /users/:id` | Datos de perfil de un usuario (incluyendo name-style para colores) |
| `GET /runs?user=:id` | Runs de un usuario para perfil y última actividad |
| `GET /users/:id/personal-bests` | Personal bests de un usuario agrupados por juego |
| `GET /series` | Listado de series de juegos |
| `GET /platforms` | Plataformas disponibles para el filtro |

### API v2

| Endpoint | Uso |
|---|---|
| `GET /GetChallenge?id=:id` | Datos de un challenge incluyendo standings, premios y usuarios |

---

## Base de datos

Se utiliza **SQLite** en desarrollo. El modelo de usuario personalizado extiende `AbstractBaseUser` de Django.

### Tabla `users_user`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Integer (PK) | Identificador único |
| `username` | CharField(20) | Nombre de usuario único, sin espacios |
| `email` | EmailField | Correo electrónico único |
| `password` | CharField | Contraseña hasheada (bcrypt) |
| `created_at` | DateTimeField | Fecha de registro |
| `is_active` | BooleanField | Usuario activo |
| `is_staff` | BooleanField | Acceso al admin de Django |

### Endpoints del backend propio

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/register` | Registro de usuario, devuelve token JWT y objeto user |
| `POST` | `/api/login` | Login, devuelve token JWT y objeto user |

---

## Internacionalización

Los textos de la interfaz están traducidos a tres idiomas mediante `@ngx-translate/core`. Los archivos JSON se encuentran en `src/assets/i18n/`:

| Archivo | Idioma |
|---|---|
| `es.json` | Español |
| `en.json` | Inglés |
| `zh.json` | Chino simplificado |

El idioma seleccionado se persiste en `localStorage` y se aplica en el arranque de la aplicación.

---

*Desarrollado por Oscar Piña Suárez — Trabajo Final de Grado 2026*
