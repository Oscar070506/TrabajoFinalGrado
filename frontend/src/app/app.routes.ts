import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { GameHomeComponent } from './pages/game/game-home/game-home';
import { GameDetailsComponent } from './pages/game/game-details/game-details';
import { PopularGamesComponent } from './pages/game/popular-games/popular-games';
import { SearchBarComponent } from './shared/components/filters/search/search';
import { UserProfileComponent } from './pages/user/user-profile/user-profile';
import { MyProfileComponent } from './pages/user/my-profile/my-profile';
import { ChallengesComponent } from './pages/game/challenges/challenges';
import { NotFound } from './pages/not-found/not-found';
import { GameSeries } from './shared/components/game-series/game-series';

export const routes: Routes = [
  { path: '',                    redirectTo: 'home', pathMatch: 'full' },
  { path: 'home',                component: HomeComponent },
  { path: 'login',               component: LoginComponent },
  { path: 'register',            component: RegisterComponent },
  { path: 'game',                component: GameHomeComponent },
  { path: 'game/:id',            component: GameDetailsComponent },
  { path: 'games/popular-games', component: PopularGamesComponent },
  { path: 'search',              component: SearchBarComponent },
  { path: 'profile',             component: MyProfileComponent },
  { path: 'user/:id',            component: UserProfileComponent },
  { path: 'challenges',          component: ChallengesComponent },
  { path: 'series',              component: GameSeries },
  { path: '**',                  component: NotFound }
];