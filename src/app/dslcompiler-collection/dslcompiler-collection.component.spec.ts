import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DSLCompilerCollectionComponent } from './dslcompiler-collection.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DSLCompilerCollectionComponent', () => {
  let component: DSLCompilerCollectionComponent;
  let fixture: ComponentFixture<DSLCompilerCollectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DSLCompilerCollectionComponent],
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
      ],
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
