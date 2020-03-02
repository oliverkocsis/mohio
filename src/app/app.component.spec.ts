import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { ProductBacklogItemFormComponent } from './product-backlog-item-form/product-backlog-item-form.component';
import { ProductBacklogItemListComponent } from './product-backlog-item-list/product-backlog-item-list.component';
import { ProductBacklogItemService } from './product-backlog-item.service';


describe('AppComponent', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
      ],
      declarations: [
        AppComponent,
        ProductBacklogItemFormComponent,
        ProductBacklogItemListComponent,
      ],
      providers: [{ provide: ProductBacklogItemService, useValue: {} }],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
