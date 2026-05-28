import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FooterComponent } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, FooterComponent, TranslateModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('lang') || 'es';
    translate.setDefaultLang('es');
    translate.use(savedLang);
  }
}