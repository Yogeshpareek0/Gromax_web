import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private _loading$ = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  readonly loading$ = this._loading$.asObservable();

  show(): void {
    this.requestCount++;
    if (this.requestCount > 0 && !this._loading$.value) {
      this._loading$.next(true);
    }
  }

  hide(): void {
    this.requestCount = Math.max(this.requestCount - 1, 0);

    if (this.requestCount === 0 && this._loading$.value) {
      this._loading$.next(false);
    }
  }
}
