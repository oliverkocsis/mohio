import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProductBacklogItemFormComponent } from './product-backlog-item-form/product-backlog-item-form.component';
import { ProductBacklogItemListComponent } from './product-backlog-item-list/product-backlog-item-list.component';

@NgModule({
  declarations: [
    AppComponent,
    ProductBacklogItemFormComponent,
    ProductBacklogItemListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
