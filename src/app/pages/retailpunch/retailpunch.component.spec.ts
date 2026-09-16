import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetailpunchComponent } from './retailpunch.component';

describe('RetailpunchComponent', () => {
  let component: RetailpunchComponent;
  let fixture: ComponentFixture<RetailpunchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetailpunchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetailpunchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
