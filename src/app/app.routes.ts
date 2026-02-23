import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { GameHomeComponent } from './pages/game/game-home/game-home';
import { GameLeaderboard } from './pages/game/game-leaderboard/game-leaderboard';
import { PopularGamesComponent } from './pages/game/popular-games/popular-games';
import { NotFoundError } from 'rxjs/internal/util/NotFoundError';
import { SearchBarComponent } from './pages/search/search';

export const routes: Routes = [
  // Ruta raíz - pantalla de inicio con logo
  { path: '',         redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',     component: HomeComponent },

  // Auth
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Catálogo y juegos
  { path: 'game',                                       component: GameHomeComponent },
  { path: 'game/:id',                                   component: GameLeaderboard },
  { path: 'game/:id/category/:categoryId',              component: GameLeaderboard },
  { path: 'games/popular-games',                              component: PopularGamesComponent },

  // Búsqueda
  { path: 'search',   component: SearchBarComponent },

  // 404 
  { path: '**',       component: NotFoundError }
];