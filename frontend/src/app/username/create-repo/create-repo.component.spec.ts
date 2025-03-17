import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRepoComponent } from './create-repo.component';

describe('CreateRepoComponent', () => {
  let component: CreateRepoComponent;
  let fixture: ComponentFixture<CreateRepoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreateRepoComponent]
    });
    fixture = TestBed.createComponent(CreateRepoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
