import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  Router
} from '@angular/router';
import { of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthenticatedGuard
  implements CanLoad, CanActivate, CanActivateChild {
  constructor(
    private readonly router: Router,
    private readonly authStore: AuthStore
  ) {}

  canLoad() {
    return this.isAuth$();
  }

  canActivate() {
    return this.isAuth$();
  }

  canActivateChild() {
    return this.isAuth$();
  }

  private isAuth$() {
    return this.authStore.vm$.pipe(
      take(1),
      map(({ isLoggedIn }) => isLoggedIn),
      tap(isLoggedIn => {
        if (!isLoggedIn) {
          this.router.navigate(['/not-auth']);
        }
      })
    );
  }
}
