import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NtirComponent } from './ntir.component';

describe('PdiComponent', () => {
  let component: NtirComponent;
  let fixture: ComponentFixture<NtirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NtirComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NtirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
