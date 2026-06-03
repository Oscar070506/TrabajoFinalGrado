import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.css']
})
export class NotFound {

  private readonly images = [
    '/404/404_Bandicoot.png',
    '/404/404_Kirby.png',
    '/404/404_Mario.png',
    '/404/404_Minecraft.png'
    ];

  randomImage = this.images[Math.floor(Math.random() * this.images.length)];

  particles = Array.from({ length: 18 }, () => {
    const size  = Math.random() * 6 + 3;
    const left  = Math.random() * 100;
    const delay = Math.random() * 4;
    const dur   = Math.random() * 4 + 4;
    const op    = Math.random() * 0.5 + 0.2;
    return `left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${dur}s;opacity:${op}`;
  });
}