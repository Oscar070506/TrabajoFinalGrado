import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { GameHomeComponent } from './pages/game/game-home/game-home';
import { SearchBarComponent } from './pages/search/search';

export const routes: Routes = [
  // Ruta raíz → pantalla de inicio con logo
  { path: '',        redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',    component: HomeComponent },

  // Auth
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Catálogo y juegos
  { path: 'game',         component: GameHomeComponent },

  // Búsqueda
  { path: 'search',       component: SearchBarComponent }
];