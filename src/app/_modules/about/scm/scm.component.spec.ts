import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SCMComponent              } from './scm.component';

describe('ScmComponent', () => {
  let component: SCMComponent;
  let fixture: ComponentFixture<SCMComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SCMComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SCMComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
