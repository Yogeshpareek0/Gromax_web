import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangestockComponent } from './exchangestock.component';

describe('ExchangestockComponent', () => {
  let component: ExchangestockComponent;
  let fixture: ComponentFixture<ExchangestockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangestockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangestockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
