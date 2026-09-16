import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StocktransferComponent } from './stocktransfer.component';

describe('StocktransferComponent', () => {
  let component: StocktransferComponent;
  let fixture: ComponentFixture<StocktransferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StocktransferComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StocktransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
