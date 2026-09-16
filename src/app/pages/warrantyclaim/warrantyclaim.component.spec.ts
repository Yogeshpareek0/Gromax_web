import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyclaimComponent } from './warrantyclaim.component';

describe('WarrantyclaimComponent', () => {
  let component: WarrantyclaimComponent;
  let fixture: ComponentFixture<WarrantyclaimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyclaimComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyclaimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
