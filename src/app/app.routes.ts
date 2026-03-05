import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { GameHomeComponent } from './pages/game/game-home/game-home';
import { GameDetailsComponent } from './pages/game/game-details/game-details';
import { PopularGamesComponent } from './pages/game/popular-games/popular-games';
import { NotFoundErrorCtor } from 'rxjs/internal/util/NotFoundError';
import { SearchBarComponent } from './pages/search/search';
import { UserProfileComponent } from './pages/user/user-profile/user-profile';

export const routes: Routes = [
  { path: '',                   redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',               component: HomeComponent },

  // Auth
  { path: 'login',              component: LoginComponent },
  { path: 'register',           component: RegisterComponent },

  // Catálogo y juegos
  { path: 'game',               component: GameHomeComponent },
  { path: 'game/:id',           component: GameDetailsComponent },
  { path: 'games/popular-games', component: PopularGamesComponent },

  // Búsqueda
  { path: 'search',             component: SearchBarComponent },

  // Perfil 
  { path: 'user/:id', component: UserProfileComponent }

];