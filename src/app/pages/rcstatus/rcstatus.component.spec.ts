import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RcstatusComponent } from './rcstatus.component';

describe('RcstatusComponent', () => {
  let component: RcstatusComponent;
  let fixture: ComponentFixture<RcstatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RcstatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RcstatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
