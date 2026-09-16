import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadexcelComponent } from './uploadexcel.component';

describe('UploadexcelComponent', () => {
  let component: UploadexcelComponent;
  let fixture: ComponentFixture<UploadexcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadexcelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadexcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
