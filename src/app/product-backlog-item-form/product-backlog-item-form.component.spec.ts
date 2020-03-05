import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProductBacklogItemFormComponent } from './product-backlog-item-form.component';
import { ProductBacklogItemService } from '../product-backlog-item.service';
import { ProductBacklogItem } from '../product-backlog-item';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

describe('ProductBacklogItemFormComponent', () => {
  let component: ProductBacklogItemFormComponent;
  let fixture: ComponentFixture<ProductBacklogItemFormComponent>;
  let productBacklogItemService: ProductBacklogItemService;
  let productBacklogItemServiceStub: Partial<ProductBacklogItemService> = jasmine.createSpyObj({
    create: of(0),
    read: of(new ProductBacklogItem("description", 0, 1, 2)),
  });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatInputModule,
        MatButtonModule,
      ],
      declarations: [ProductBacklogItemFormComponent],
      providers: [{ provide: ProductBacklogItemService, useValue: productBacklogItemServiceStub }]
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(ProductBacklogItemFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    productBacklogItemService = fixture.debugElement.injector.get(ProductBacklogItemService);

  });

  beforeEach(() => {

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the input fields of a description, order, estimate, and value', () => {
    const debug: DebugElement = fixture.debugElement;
    const description = debug.query(By.css('textarea[formControlName="description"]'));
    const order = debug.query(By.css('input[formControlName="order"]'));
    const estimate = debug.query(By.css('input[formControlName="estimate"]'));
    const value = debug.query(By.css('input[formControlName="value"]'));
    expect(description.nativeElement).toBeDefined();
    expect(order.nativeElement).toBeDefined();
    expect(estimate.nativeElement).toBeDefined();
    expect(value.nativeElement).toBeDefined();
  });

  it('should create a product backlog item on submit', () => {
    component.onSubmit();
    expect(productBacklogItemService.create).toHaveBeenCalled();
  });

});
