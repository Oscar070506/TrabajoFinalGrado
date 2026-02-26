import { Injectable, signal } from '@angular/core';

/**
 * @service PopUpVideoService
 * @description Servicio global para controlar el modal de vídeo.
 * Al estar en el componente raíz, el modal se renderiza fuera de
 * cualquier contenedor que pueda limitar position: fixed.
 */
@Injectable({ providedIn: 'root' })
export class PopUpVideoService {

  /** URL embed del vídeo activo. `null` cuando el modal está cerrado. */
  activeVideoUrl = signal<string | null>(null);

  /**
   * @method open
   * @description Convierte una URL de YouTube a formato embed y abre el modal.
   * @param {string} url - URL normal de YouTube.
   */
  open(url: string): void {
    const videoId = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
      : url;

    // Evita reabrir si ya está activo el mismo vídeo
    if (this.activeVideoUrl() === embedUrl) return;

    this.activeVideoUrl.set(embedUrl);
      console.log('activeVideoUrl ahora es:', this.activeVideoUrl());

  }

  /** @method close */
  close(): void {
    this.activeVideoUrl.set(null);
  }
}