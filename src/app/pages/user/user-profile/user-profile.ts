import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserInfoComponent } from '../../../shared/components/profile/user-info/user-info';
import { UserTabsComponent } from '../../../shared/components/profile/user-tabs/user-tabs';

/**
 * @component UserProfileComponent
 * @description Página de perfil de un usuario de speedrun.com.
 * Obtiene el ID del usuario desde la ruta `/user/:id`,
 * llama a la API y pasa los datos a los subcomponentes.
 *
 * @example
 * // Ruta: /user/8d3owyox
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, UserInfoComponent, UserTabsComponent],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfileComponent implements OnInit {

  /** Datos del usuario devueltos por la API. */
  user: any = null;

  /** Indica si la carga está en curso. */
  loading: boolean = false;

  /** Mensaje de error. `null` si no hay error. */
  error: string | null = null;

  private readonly API = 'https://www.speedrun.com/api/v1';

  /**
   * @constructor
   * @param {ActivatedRoute} route - Para leer el parámetro `:id` de la URL.
   * @param {HttpClient} http
   * @param {ChangeDetectorRef} cdr
   */
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * @method ngOnInit
   * @description Lee el ID de la ruta y carga los datos del usuario.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.fetchUser(id);
  }

  /**
   * @method fetchUser
   * @description Llama a `/users/{id}` y guarda los datos en `user`.
   * @param {string} id - ID del usuario.
   */
  fetchUser(id: string): void {
    this.loading = true;
    this.error   = null;

    this.http.get<any>(`${this.API}/users/${id}`).subscribe({
      next: res => {
        this.user    = res.data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error   = `Error ${err.status}: no se pudo cargar el perfil.`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}