import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularTutorialsnWebComponent } from './angular-tutorialsn-web.component';

describe('AngularTutorialsnWebComponent', () => {
  let component: AngularTutorialsnWebComponent;
  let fixture: ComponentFixture<AngularTutorialsnWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AngularTutorialsnWebComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AngularTutorialsnWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
