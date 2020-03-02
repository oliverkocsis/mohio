import { Injectable } from '@angular/core';
import { ProductBacklogItem } from './product-backlog-item';
import { of, Observable, ReplaySubject, Subject } from 'rxjs';

@Injectable()
export class ProductBacklogItemService {
  private productBacklogItemList: ProductBacklogItem[];
  private subject: Subject<ProductBacklogItem>;

  constructor() {
    this.productBacklogItemList = [];
    this.subject = new ReplaySubject<ProductBacklogItem>();
  }

  public create(productBacklogItem: ProductBacklogItem): Observable<any> {
    const id = this.productBacklogItemList.length;
    productBacklogItem.id = id;
    this.productBacklogItemList.push(productBacklogItem);
    this.subject.next(productBacklogItem)
    return of(id);
  }

  public read(id: any): Observable<ProductBacklogItem> {
    return of(this.productBacklogItemList[id]);
  }

  public list(): Subject<ProductBacklogItem> {
    return this.subject;
  }
}
