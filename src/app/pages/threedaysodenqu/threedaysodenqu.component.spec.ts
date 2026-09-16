import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreedaysodenquComponent } from './threedaysodenqu.component';

describe('ThreedaysodenquComponent', () => {
  let component: ThreedaysodenquComponent;
  let fixture: ComponentFixture<ThreedaysodenquComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreedaysodenquComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreedaysodenquComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
