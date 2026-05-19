# Trabajo Final de Grado — Speedrun Tracker

## Objetivo

Avanzar con el trabajo final del grado agregándole funcionalidad mínima.

---

## Requisitos e instalación

Es necesario tener instalado **VSCode** con las extensiones mínimas para funcionar con HTML, CSS y JavaScript.

---

## Estructura

He optado por cambiar totalmente la estructura del proyecto para hacerlo más escalable con **Angular**, dado que si se diese el caso podría crecer de forma más ordenada.

En dicha estructura se han añadido los siguientes elementos, todos conceptos básicos de Angular vistos en clase:

- **Componentes** — bloques de UI reutilizables
- **Pages** — vistas principales de la aplicación
- **Servicios** — lógica compartida entre componentes

Adicionalmente, se han incluido elementos pensados para mejorar el flujo de trabajo a posteriori:

- **Pipes** — para transformar datos en el template de forma limpia
- **Guards** — para el cifrado de contraseñas
- **Interceptors** — por si se opta por añadir tokens de autenticación en un futuro

---

## Funcionalidades básicas añadidas

Mediante llamadas a la API de **speedrun.com** se han implementado las siguientes funcionalidades:

- **Popular Games** — página que muestra los juegos más activos en tiempo real, ordenados por número de runs verificadas recientes
- **Leaderboards por juego** — cada juego muestra su ranking con los mejores tiempos, incluyendo trofeos para el top 3
- **Filtro por categoría** — el leaderboard se puede filtrar por las categorías `per-game` o `per-level` disponibles de cada juego
- **Vídeo de la run** — al pulsar cualquier entrada del ranking se abre un popup con el vídeo de YouTube de esa partida concreta

---

## Funcionalidades a implementar

- Completar el resto de pages incluidas en la estructura del proyecto
- Estudiar e implementar un sistema de modal propio que mejore la calidad de los popups y se adecúe al estilo visual de la página
