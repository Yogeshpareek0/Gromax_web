import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferstockComponent } from './transferstock.component';

describe('TransferstockComponent', () => {
  let component: TransferstockComponent;
  let fixture: ComponentFixture<TransferstockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferstockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferstockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
