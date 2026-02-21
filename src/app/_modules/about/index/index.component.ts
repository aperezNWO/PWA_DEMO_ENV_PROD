// ANGULAR CORE
import { 
  Component, 
  computed, 
  Directive, 
  effect, 
  inject, 
  input, 
  model, 
  output, 
  signal, 
  untracked, 
  viewChildren 
}                         from '@angular/core';
import { DecimalPipe    } from '@angular/common';
import { toSignal       } from '@angular/core/rxjs-interop';
// GLOBAL
import { _Route, routes } from '../../../app-routing.module';
// THIRD PARTY
import { debounceTime, delay, Observable, of, Subject, switchMap, tap } from 'rxjs';

// ============================================================
// TYPES - Exported to avoid naming collisions
// ============================================================

//
export type Index_SortDirection                                     = 'asc' | 'desc' | '';
export type Index_SortColumn                                        = keyof _Route | '';
export const index_pagerotate: Record<Index_SortDirection, Index_SortDirection> = { 
  asc: 'desc', 
  desc: '', 
  '': 'asc' 
};
//
export interface Index_SearchState {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: Index_SortColumn;
  sortDirection: Index_SortDirection;
}
//
export interface Index_SortEvent {
  column: Index_SortColumn;
  direction: Index_SortDirection;
}

export interface Index_SearchResult {
  searchPages: _Route[];
  total: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function index_matches(route: _Route, term: string): boolean {
  return route.caption?.toLowerCase().includes(term?.toLowerCase()) ?? false;
}

// ============================================================
// SORTABLE HEADER DIRECTIVE
// ============================================================

@Directive({
  selector: 'th[appSortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction() === "asc"',
    '[class.desc]': 'direction() === "desc"',
    '(click)': 'rotate()',
  }
})
export class IndexSortableHeader {
  readonly sortable  = input<Index_SortColumn>('');
  readonly direction = signal<Index_SortDirection>('');
  
  readonly sort = output<Index_SortEvent>();

  rotate(): void {
    const newDirection = index_pagerotate[this.direction()];
    this.direction.set(newDirection);
    this.sort.emit({
      column: this.sortable(),
      direction: newDirection
    });
  }
}

// ============================================================
// INDEX COMPONENT
// ============================================================

@Component({
  selector: 'app-index',
  standalone: false,
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent {
  // Dependencies
  private pipe = inject(DecimalPipe);
  
  // View children
  headers = viewChildren(IndexSortableHeader);
  
  // State
  private state = signal<Index_SearchState>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
    sortColumn: '',
    sortDirection: '',
  });

  // Readonly computed state
  readonly currentPage = computed(() => this.state().page);
  readonly pageSize    = computed(() => this.state().pageSize);
  readonly searchTerm  = computed(() => this.state().searchTerm);
  
  // Model for ng-bootstrap two-way binding
  page = model<number>(1);
  
  // Loading state
  private loadingSignal     = signal<boolean>(true);
  readonly loading          = this.loadingSignal.asReadonly();

  // Search trigger
  private searchTrigger     = new Subject<void>();

  // Search result
  private searchResult      = toSignal(
    this.searchTrigger.pipe(
      tap(() => this.loadingSignal.set(true)),
      debounceTime(200),
      switchMap(() => this.performSearch()),
      delay(200),
      tap(() => this.loadingSignal.set(false))
    ),
    { initialValue: { searchPages: [] as _Route[], total: 0 } }
  );

  // Computed results
  readonly pagelist = computed(() => this.searchResult().searchPages);
  readonly total    = computed(() => this.searchResult().total);

  constructor() {
    // Initial search
    this.searchTrigger.next();
    
    // Sync model with state
    effect(() => {
      const currentPage = this.currentPage();
      untracked(() => {
        this.page.set(currentPage);
      });
    });
    
    // Handle external page changes
    effect(() => {
      const modelPage = this.page();
      untracked(() => {
        if (modelPage !== this.state().page) {
          this.state.update(s => ({ ...s, page: modelPage }));
          this.searchTrigger.next();
        }
      });
    });
    
    // Reset other headers when sorting changes
    effect(() => {
      const currentSort = this.state().sortColumn;
      
      untracked(() => {
        this.headers().forEach(header => {
          if (header.sortable() !== currentSort) {
            header.direction.set('');
          }
        });
      });
    });
  }

  private performSearch(): Observable<Index_SearchResult> {
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this.state();
    
    // Filter routes with captions
    let filteredRoutes = routes.filter(route => 
      route.caption && route.caption.trim() !== ''
    );

    // Apply search filter
    if (searchTerm) {
      filteredRoutes = filteredRoutes.filter(route => index_matches(route, searchTerm));
    }

    const total = filteredRoutes.length;

    // Sort
    if (sortColumn && sortDirection) {
      filteredRoutes = [...filteredRoutes].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === undefined || bVal === undefined) return 0;
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Paginate
    const paginatedRoutes = filteredRoutes.slice(
      (page - 1) * pageSize, 
      (page - 1) * pageSize + pageSize
    );

    return of({ searchPages: paginatedRoutes, total });
  }

  // Public methods
  setPage(page: number): void {
    this.state.update(s => ({ ...s, page }));
    this.searchTrigger.next();
  }

  setPageSize(pageSize: number): void {
    this.state.update(s => ({ ...s, pageSize, page: 1 }));
    this.searchTrigger.next();
  }

  setSearchTerm(searchTerm: string): void {
    this.state.update(s => ({ ...s, searchTerm, page: 1 }));
    this.searchTrigger.next();
  }

  onSort(event: Index_SortEvent): void {
    this.state.update(s => ({
      ...s,
      sortColumn: event.column,
      sortDirection: event.direction
    }));
    this.searchTrigger.next();
  }

  speakText(paramSearchTerm: string): void {
    this.setSearchTerm(paramSearchTerm);
  }

  clearText(): void {
    this.setSearchTerm('');
  }
}