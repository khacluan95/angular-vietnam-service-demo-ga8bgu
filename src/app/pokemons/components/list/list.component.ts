import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { ListStore } from './list.store';

@Component({
  selector: 'pokemon-list',
  template: `
    <ng-container *ngIf="(vm$ | async) as vm">
      <paginator
        [currentPage]="vm.currentPage"
        [rowsPerPageOptions]="[10, 20, 40, 80]"
        [rows]="vm.limit"
        [totalRecords]="vm.total"
        (onPageChange)="onPageChanged($event)"
      ></paginator>
      <input
        type="text"
        class="w-2/4 p-2 rounded border border-gray-600"
        placeholder="Filter by pokemon name..."
        [formControl]="query"
      />
      <data-table [isLoading]="vm.isLoading" [data]="vm.pokemons"></data-table>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ListStore]
})
export class ListComponent {
  query = new FormControl('');

  readonly vm$ = this.listStore.vm$;

  constructor(private readonly listStore: ListStore) {
    this.listStore.setQuery(this.query.valueChanges.pipe(debounceTime(250)));
  }

  onPageChanged(event) {
    this.listStore.setPagination({
      currentPage: event.page,
      limit: event.rows,
      offset: event.first - event.rows
    });

    this.query.setValue('');
  }
}
