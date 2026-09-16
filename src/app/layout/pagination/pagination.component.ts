import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 20;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  totalPages: number = 0;
  visiblePages: number[] = [];
  maxVisible: number = 3;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePages();
  }

  private calculatePages(): void {
    this.totalPages = this.pageSize > 0 ? Math.ceil(this.totalItems / this.pageSize) : 0;
    this.updateVisiblePages();
  }

  private updateVisiblePages(): void {
    if (this.totalPages <= this.maxVisible) {
      this.visiblePages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
      return;
    }

    let start = Math.max(this.currentPage - Math.floor(this.maxVisible / 2), 1);
    let end = start + this.maxVisible - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(end - this.maxVisible + 1, 1);
    }

    this.visiblePages = [];
    for (let i = start; i <= end; i++) {
      this.visiblePages.push(i);
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
      this.updateVisiblePages(); 
    }
  }
}
