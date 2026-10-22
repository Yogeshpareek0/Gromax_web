import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SparepartorderComponent } from './sparepartorder.component';

describe('SparepartorderComponent', () => {
  let component: SparepartorderComponent;
  let fixture: ComponentFixture<SparepartorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SparepartorderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SparepartorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
