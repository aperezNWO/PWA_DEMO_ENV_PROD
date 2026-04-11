import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramDescriptionComponent } from './program-description.component';

describe('ProgramDescriptionComponent', () => {
  let component: ProgramDescriptionComponent;
  let fixture: ComponentFixture<ProgramDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramDescriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
