import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { filter, pluck, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { SimplifiedPokemon } from '../../../models/pokemon';
import { BackendService } from '../../../services/backend.service';
import { AuthStore } from '../../../stores/auth.store';

interface DetailsState {
  pokemonId: number;
  pokemon: SimplifiedPokemon | null;
  status: 'loading' | 'idle';
}

@Injectable()
export class DetailsStore extends ComponentStore<DetailsState> {
  readonly pokemon$ = this.select(s => s.pokemon);
  readonly pokemonId$ = this.select(s => s.pokemonId);
  readonly status$ = this.select(s => s.status);

  readonly vm$ = this.select(
    this.pokemon$,
    this.status$,
    (pokemon, status) => ({
      pokemon,
      isLoading: status === 'loading'
    }),
    { debounce: true }
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly backend: BackendService,
    private readonly authStore: AuthStore,
    private readonly router: Router
  ) {
    super({ pokemonId: 0, pokemon: null, status: 'idle' });
    this.fetchPokemonEffect(
      this.route.params.pipe(
        pluck('id'),
        filter(id => !!id)
      )
    );
  }

  readonly fetchPokemonEffect = this.effect<string>(id$ =>
    id$.pipe(
      tap((id: string) =>
        this.patchState({
          status: 'loading',
          pokemonId: Number(id),
          pokemon: null
        })
      ),
      switchMap((id: string) =>
        this.backend.getPokemonDetail(id).pipe(
          tapResponse(pokemon => {
            this.patchState({
              pokemon,
              status: 'idle'
            });
          }, console.error)
        )
      )
    )
  );

  readonly nextIdEffect = this.effect(trigger$ =>
    trigger$.pipe(
      withLatestFrom(this.pokemonId$),
      switchMap(([, id]) => this.router.navigate(['/pokemons', id + 1]))
    )
  );

  readonly prevIdEffect = this.effect(trigger$ =>
    trigger$.pipe(
      withLatestFrom(this.pokemonId$),
      switchMap(([, id]) => this.router.navigate(['/pokemons', id - 1]))
    )
  );

  readonly likeEffect = this.authStore.incrementLikes;
  readonly dislikeEffect = this.authStore.incrementDislikes;
}
