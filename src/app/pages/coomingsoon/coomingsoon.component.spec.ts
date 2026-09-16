import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoomingsoonComponent } from './coomingsoon.component';

describe('CoomingsoonComponent', () => {
  let component: CoomingsoonComponent;
  let fixture: ComponentFixture<CoomingsoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoomingsoonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoomingsoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
