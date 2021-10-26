import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { combineLatest } from 'rxjs';
import { map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { PaginatedPokemon, Pokemon } from '../../../models/pokemon';
import { BackendService } from '../../../services/backend.service';

interface SetPaginationParams {
  limit: number;
  offset: number;
  currentPage: number;
}

interface ListState extends SetPaginationParams {
  status: 'loading' | 'idle';
  original: Pokemon[];
  filtered: Pokemon[];
  query: string;
  total: number;
}

@Injectable()
export class ListStore extends ComponentStore<ListState> {
  readonly vm$ = this.select(
    this.state$,
    ({ status, filtered, total, limit, currentPage }) => ({
      pokemons: filtered as Pokemon[],
      isLoading: status === 'loading',
      isIdle: status === 'idle',
      total,
      limit,
      currentPage
    }),
    { debounce: true }
  );

  constructor(private readonly backend: BackendService) {
    super({
      status: 'idle',
      original: [],
      filtered: [],
      query: '',
      total: 0,
      limit: 20,
      offset: 0,
      currentPage: 1
    });

    this.fetchPokemonsEffect(
      combineLatest([this.select(s => s.limit), this.select(s => s.offset)])
    );

    this.filterEffect(this.select(s => s.query));
  }

  readonly setQuery = this.updater<string>((state, query) => ({
    ...state,
    query
  }));

  readonly setPagination = this.updater<SetPaginationParams>(
    (state, { limit, offset, currentPage }) => ({
      ...state,
      limit,
      offset,
      currentPage
    })
  );

  readonly fetchPokemonsEffect = this.effect<[number, number]>(pagination$ =>
    pagination$.pipe(
      tap(() => this.patchState({ status: 'loading' })),
      switchMap(([limit, offset]) =>
        this.backend.getPokemons(limit, offset).pipe(
          tapResponse<PaginatedPokemon>(response => {
            this.patchState({
              original: response.results,
              filtered: response.results,
              total: response.count,
              status: 'idle'
            });
          }, console.error)
        )
      )
    )
  );

  readonly filterEffect = this.effect<string>(query$ =>
    query$.pipe(
      withLatestFrom(this.select(s => s.original)),
      tap(([query, original]) => {
        this.patchState({
          filtered: query
            ? original.filter(pokemon =>
                pokemon.name.toLowerCase().includes(query.toLowerCase())
              )
            : original
        });
      })
    )
  );
}
