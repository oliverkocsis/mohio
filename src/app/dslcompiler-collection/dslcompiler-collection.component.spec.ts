import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DSLCompilerCollectionComponent } from './dslcompiler-collection.component';

describe('DSLCompilerCollectionComponent', () => {
  let component: DSLCompilerCollectionComponent;
  let fixture: ComponentFixture<DSLCompilerCollectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DSLCompilerCollectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DSLCompilerCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
