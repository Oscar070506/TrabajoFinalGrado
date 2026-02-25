import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * @pipe SafePipe
 * @description Marca una URL como segura para usarla en un src de iframe.
 * Necesario porque Angular bloquea URLs dinámicas por defecto.
 *
 * @example
 * <iframe [src]="videoUrl | safe"></iframe>
 */
@Pipe({ name: 'safe', standalone: true })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}