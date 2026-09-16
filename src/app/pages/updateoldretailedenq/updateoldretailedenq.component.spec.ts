import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateoldretailedenqComponent } from './updateoldretailedenq.component';

describe('UpdateoldretailedenqComponent', () => {
  let component: UpdateoldretailedenqComponent;
  let fixture: ComponentFixture<UpdateoldretailedenqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateoldretailedenqComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateoldretailedenqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
