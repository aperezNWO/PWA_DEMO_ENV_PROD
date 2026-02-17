import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisionHUBComponent } from './vision-HUB.component';

describe('VisionHUBComponent', () => {
  let component: VisionHUBComponent;
  let fixture: ComponentFixture<VisionHUBComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisionHUBComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VisionHUBComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
