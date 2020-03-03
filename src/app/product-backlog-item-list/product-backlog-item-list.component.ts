import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductBacklogItem } from '../product-backlog-item';
import { ProductBacklogItemService } from '../product-backlog-item.service';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-product-backlog-item-list',
  templateUrl: './product-backlog-item-list.component.html',
  styleUrls: ['./product-backlog-item-list.component.scss']
})
export class ProductBacklogItemListComponent implements OnInit {

  public displayedColumns = ['description', 'order', 'estimate', 'value'];
  public productBacklogItemList: ProductBacklogItem[] = [];
  @ViewChild(MatTable, { static: false }) matTable: MatTable<any>;

  constructor(private productBacklogItemService: ProductBacklogItemService) { }

  ngOnInit() {
    this.productBacklogItemService.list().subscribe((productBacklogItem: ProductBacklogItem) => {
      this.productBacklogItemList.push(productBacklogItem);
      this.matTable.renderRows();
    });
  }

}
