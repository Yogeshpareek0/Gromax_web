import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularsComponent } from './circulars.component';

describe('CircularsComponent', () => {
  let component: CircularsComponent;
  let fixture: ComponentFixture<CircularsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircularsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
