import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatesparepartorderComponent } from './updatesparepartorder.component';

describe('UpdatesparepartorderComponent', () => {
  let component: UpdatesparepartorderComponent;
  let fixture: ComponentFixture<UpdatesparepartorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatesparepartorderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatesparepartorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
