import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProductBacklogItemFormComponent } from './product-backlog-item-form/product-backlog-item-form.component';
import { ProductBacklogItemListComponent } from './product-backlog-item-list/product-backlog-item-list.component';
import { ProductBacklogItemService } from './product-backlog-item.service';
import { DSLCompilerCollectionComponent } from './dslcompiler-collection/dslcompiler-collection.component';


@NgModule({
  declarations: [
    AppComponent,
    ProductBacklogItemFormComponent,
    ProductBacklogItemListComponent,
    DSLCompilerCollectionComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatCardModule,
  ],
  providers: [ProductBacklogItemService],
  bootstrap: [AppComponent]
})
export class AppModule { }
