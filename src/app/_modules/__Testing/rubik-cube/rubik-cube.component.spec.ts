import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RubikCubeComponent } from './rubik-cube.component';

describe('RubikCubeComponent', () => {
  let component: RubikCubeComponent;
  let fixture: ComponentFixture<RubikCubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RubikCubeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RubikCubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
