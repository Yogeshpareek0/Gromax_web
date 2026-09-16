import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader/loader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit, OnDestroy {
  visible = false;
  private sub?: Subscription;

  constructor(private loader: LoaderService) { }

  ngOnInit(): void {
    this.sub = this.loader.loading$.subscribe(v => this.visible = v);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
