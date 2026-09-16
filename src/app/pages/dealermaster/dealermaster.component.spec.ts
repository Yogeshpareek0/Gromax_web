import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DealermasterComponent } from './dealermaster.component';

describe('DealermasterComponent', () => {
  let component: DealermasterComponent;
  let fixture: ComponentFixture<DealermasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealermasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DealermasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
