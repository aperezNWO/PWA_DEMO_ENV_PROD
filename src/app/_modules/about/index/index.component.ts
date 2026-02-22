// ANGULAR CORE
import { 
  Component, 
  computed,   // v21 work: computed() - derives reactive values from signals automatically
  Directive, 
  effect,     // v21 work: effect() - runs side effects when dependent signals change
  inject,     // v21 work: inject() - modern functional dependency injection, replaces constructor injection
  input,      // v21 work: input() - new signal-based input, replaces @Input() decorator
  model,      // v21 work: model() - new signal-based two-way binding primitive, replaces @Input/@Output pairs
  output,     // v21 work: output() - new signal-based output, replaces @Output() + EventEmitter
  signal,     // v21 work: signal() - core reactive primitive, replaces plain properties + manual CD
  untracked,  // v21 work: untracked() - reads signal values without creating reactive dependencies
  viewChildren // v21 work: viewChildren() - signal-based query, replaces @ViewChildren decorator
}                         from '@angular/core';
import { DecimalPipe    } from '@angular/common';
import { toSignal       } from '@angular/core/rxjs-interop'; // v21 work: toSignal() - bridges RxJS Observables into the Signals world
// GLOBAL
import { _Route, routes } from '../../../app-routing.module';
// THIRD PARTY
import { debounceTime, delay, Observable, of, Subject, switchMap, tap } from 'rxjs';

// ============================================================
// TYPES - Exported to avoid naming collisions
// ============================================================

export type Index_SortDirection                                     = 'asc' | 'desc' | '';
export type Index_SortColumn                                        = keyof _Route | '';
export const index_pagerotate: Record<Index_SortDirection, Index_SortDirection> = { 
  asc: 'desc', 
  desc: '', 
  '': 'asc' 
};

export interface Index_SearchState {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: Index_SortColumn;
  sortDirection: Index_SortDirection;
}

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
  standalone: true, // v21 work: standalone: true is now the Angular default for new directives
  host: {
    '[class.asc]': 'direction() === "asc"',   // v21 work: reading signal value directly in host binding expression
    '[class.desc]': 'direction() === "desc"', // v21 work: reading signal value directly in host binding expression
    '(click)': 'rotate()',
  }
})
export class IndexSortableHeader {
  // v21 work: input() signal-based input - replaces @Input() sortable: Index_SortColumn = ''
  // Provides type safety and integrates with the signals reactivity graph
  readonly sortable  = input<Index_SortColumn>('');

  // v21 work: signal() for local directive state - direction is internally writable
  readonly direction = signal<Index_SortDirection>('');
  
  // v21 work: output() signal-based event emitter - replaces @Output() sort = new EventEmitter<Index_SortEvent>()
  readonly sort = output<Index_SortEvent>();

  rotate(): void {
    // v21 work: reading input() and signal() values using function-call syntax
    const newDirection = index_pagerotate[this.direction()];
    // v21 work: signal.set() to update direction state
    this.direction.set(newDirection);
    // v21 work: output().emit() replaces EventEmitter.emit()
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
  // v21 work: inject() for functional dependency injection - replaces declaring DecimalPipe in the constructor parameters
  private pipe = inject(DecimalPipe);
  
  // v21 work: viewChildren() signal-based query - replaces @ViewChildren(IndexSortableHeader) headers: QueryList<IndexSortableHeader>
  // Returns a readonly signal containing the array of matched directive instances
  headers = viewChildren(IndexSortableHeader);
  
  // v21 work: signal() to hold the entire search state as a single reactive object
  // Replaces multiple @Input properties or a BehaviorSubject<Index_SearchState>
  private state = signal<Index_SearchState>({
    page: 1,
    pageSize: 10,
    searchTerm: '',
    sortColumn: '',
    sortDirection: '',
  });

  // v21 work: computed() signals that slice individual fields out of the state signal
  // Consumers only re-evaluate when the specific field they depend on changes
  readonly currentPage = computed(() => this.state().page);
  readonly pageSize    = computed(() => this.state().pageSize);
  readonly searchTerm  = computed(() => this.state().searchTerm);
  
  // v21 work: model() - new two-way bindable signal primitive
  // Replaces the @Input()/@Output() pair pattern: @Input() page + @Output() pageChange = new EventEmitter()
  // Enables [(page)]="myPage" two-way binding in the template
  page = model<number>(1);
  
  // v21 work: signal() for loading state with .asReadonly() to expose a readonly view
  // .asReadonly() prevents external callers from calling .set() or .update() on the signal
  private loadingSignal     = signal<boolean>(true);
  readonly loading          = this.loadingSignal.asReadonly();

  // Search trigger (standard RxJS Subject - not a v21 feature, bridges imperative calls into the reactive pipeline)
  private searchTrigger     = new Subject<void>();

  // v21 work: toSignal() converts an Observable into a signal - part of the rxjs-interop package
  // Automatically subscribes, unsubscribes (tied to injection context), and exposes the latest
  // emitted value as a readable signal - bridging RxJS and the Signals reactivity model
  private searchResult      = toSignal(
    this.searchTrigger.pipe(
      tap(() => this.loadingSignal.set(true)),  // v21 work: signal.set() inside an RxJS tap() operator
      debounceTime(200),
      switchMap(() => this.performSearch()),
      delay(200),
      tap(() => this.loadingSignal.set(false))  // v21 work: signal.set() inside an RxJS tap() operator
    ),
    { initialValue: { searchPages: [] as _Route[], total: 0 } }
  );

  // v21 work: computed() signals derived from the toSignal() result
  // These automatically update whenever searchResult signal emits a new value
  readonly pagelist = computed(() => this.searchResult().searchPages);
  readonly total    = computed(() => this.searchResult().total);

  constructor() {
    // Initial search trigger
    this.searchTrigger.next();
    
    // v21 work: effect() to sync the internal state signal to the model() signal
    // untracked() prevents the inner model.set() from being tracked as a dependency of this effect,
    // avoiding potential infinite loops between the two signals
    effect(() => {
      const currentPage = this.currentPage();
      untracked(() => {
        this.page.set(currentPage);
      });
    });
    
    // v21 work: effect() to handle external page changes driven by the model() two-way binding
    // untracked() used here to safely read this.state() without adding it as a tracked dependency,
    // preventing a circular effect → state update → effect loop
    effect(() => {
      const modelPage = this.page();
      untracked(() => {
        if (modelPage !== this.state().page) {
          this.state.update(s => ({ ...s, page: modelPage }));
          this.searchTrigger.next();
        }
      });
    });
    
    // v21 work: effect() + viewChildren() signal working together
    // When sortColumn state changes, this effect reads the headers() signal query result
    // and resets the direction signal on each non-active header directive
    // untracked() prevents headers() from being a tracked dependency of this effect
    effect(() => {
      const currentSort = this.state().sortColumn;
      
      untracked(() => {
        // v21 work: headers() - calling the viewChildren signal to get current directive instances
        this.headers().forEach(header => {
          // v21 work: reading input() signal and calling signal.set() on the directive's direction signal
          if (header.sortable() !== currentSort) {
            header.direction.set('');
          }
        });
      });
    });
  }

  private performSearch(): Observable<Index_SearchResult> {
    // v21 work: reading the state signal value to extract all search parameters at once
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this.state();
    
    let filteredRoutes = routes.filter(route => 
      route.caption && route.caption.trim() !== ''
    );

    if (searchTerm) {
      filteredRoutes = filteredRoutes.filter(route => index_matches(route, searchTerm));
    }

    const total = filteredRoutes.length;

    if (sortColumn && sortDirection) {
      filteredRoutes = [...filteredRoutes].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === undefined || bVal === undefined) return 0;
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    const paginatedRoutes = filteredRoutes.slice(
      (page - 1) * pageSize, 
      (page - 1) * pageSize + pageSize
    );

    return of({ searchPages: paginatedRoutes, total });
  }

  // Public methods - each uses signal.update() to immutably patch state, then triggers a new search
  
  setPage(page: number): void {
    // v21 work: signal.update() with spread to immutably patch a single field in the state object
    this.state.update(s => ({ ...s, page }));
    this.searchTrigger.next();
  }

  setPageSize(pageSize: number): void {
    // v21 work: signal.update() patching multiple fields atomically in a single update
    this.state.update(s => ({ ...s, pageSize, page: 1 }));
    this.searchTrigger.next();
  }

  setSearchTerm(searchTerm: string): void {
    // v21 work: signal.update() - resets page to 1 when search term changes
    this.state.update(s => ({ ...s, searchTerm, page: 1 }));
    this.searchTrigger.next();
  }

  onSort(event: Index_SortEvent): void {
    // v21 work: signal.update() to apply sort column and direction from the IndexSortableHeader output() event
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