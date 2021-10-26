import { Injectable } from '@angular/core';
import { User } from '../models/user';

import { ComponentStore } from '@ngrx/component-store';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthState {
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthStore extends ComponentStore<AuthState> {
  readonly user$ = this.select(s => s.user);

  readonly vm$ = this.select(({ user }) => ({ user, isLoggedIn: !!user }), {
    debounce: true
  });

  constructor(private readonly router: Router) {
    super({ user: null });
    this.initializeEffect();
    this.saveUserEffect(this.user$);
  }

  readonly incrementLikes = this.updater(state => ({
    ...state,
    user: { ...state.user, likes: state.user.likes + 1 }
  }));

  readonly incrementDislikes = this.updater(state => ({
    ...state,
    user: { ...state.user, dislikes: state.user.dislikes + 1 }
  }));

  readonly initializeEffect = this.effect(trigger$ =>
    trigger$.pipe(
      tap(() => {
        const currentUser = JSON.parse(
          localStorage.getItem('ngvn-demo-user')
        ) as User;

        if (currentUser) {
          this.patchState({ user: currentUser });
        }
      })
    )
  );

  readonly loginEffect = this.effect(trigger$ =>
    trigger$.pipe(
      tap(() => {
        this.patchState({
          user: {
            name: 'Chau',
            likes: 0,
            dislikes: 0
          }
        });
        this.router.navigate(['/']);
      })
    )
  );

  readonly logoutEffect = this.effect(trigger$ =>
    trigger$.pipe(
      tap(() => {
        this.patchState({ user: null });
        this.router.navigate(['/not-auth']);
      })
    )
  );

  readonly saveUserEffect = this.effect<User>(user$ =>
    user$.pipe(
      tap(user => {
        if (user == null) {
          localStorage.removeItem('ngvn-demo-user');
        } else {
          localStorage.setItem('ngvn-demo-user', JSON.stringify(user));
        }
      })
    )
  );
}
