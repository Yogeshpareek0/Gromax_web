import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaisereturnComponent } from './raisereturn.component';

describe('RaisereturnComponent', () => {
  let component: RaisereturnComponent;
  let fixture: ComponentFixture<RaisereturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaisereturnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaisereturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
