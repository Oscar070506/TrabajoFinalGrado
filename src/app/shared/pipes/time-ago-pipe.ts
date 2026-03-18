import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | null): string {
    if (!value) return '—';

    const now   = new Date();
    const date  = new Date(value);
    const secs  = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secs < 60)                        return 'hace unos segundos';
    if (secs < 3600)   { const m = Math.floor(secs / 60);    return `hace ${m} minuto${m !== 1 ? 's' : ''}`; }
    if (secs < 86400)  { const h = Math.floor(secs / 3600);  return `hace ${h} hora${h !== 1 ? 's' : ''}`; }
    if (secs < 2592000){ const d = Math.floor(secs / 86400); return `hace ${d} día${d !== 1 ? 's' : ''}`; }
    if (secs < 31536000){ const mo = Math.floor(secs / 2592000); return `hace ${mo} mes${mo !== 1 ? 'es' : ''}`; }

    const y = Math.floor(secs / 31536000);
    return `hace ${y} año${y !== 1 ? 's' : ''}`;
  }
}