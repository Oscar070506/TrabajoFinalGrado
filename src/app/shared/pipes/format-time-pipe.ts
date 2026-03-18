import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime',
  standalone: true
})
export class FormatTimePipe implements PipeTransform {

  transform(secs: number): string {
    if (!secs) return '0s';

    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);

    return [h ? `${h}h` : '', m ? `${m}m` : '', s ? `${s}s` : '']
      .filter(Boolean)
      .join(' ');
  }
}