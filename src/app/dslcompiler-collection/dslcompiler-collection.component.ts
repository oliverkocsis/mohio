import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { AbstractSyntaxGraph, Entity, Backend, File } from 'dsl-compiler-collection';

@Component({
  selector: 'app-dslcompiler-collection',
  templateUrl: './dslcompiler-collection.component.html',
  styleUrls: ['./dslcompiler-collection.component.scss']
})
export class DSLCompilerCollectionComponent implements OnInit {

  public files: File[];

  public formGroup = new FormGroup({
    name: new FormControl(''),
  });

  constructor() { }

  ngOnInit() { }

  onSubmit() {
    console.info(this.formGroup.value)
    const abstractSyntaxGraph = new AbstractSyntaxGraph();
    abstractSyntaxGraph.appendChild(new Entity(this.formGroup.value.name));
    const backend = new Backend();
    const project = backend.generate(abstractSyntaxGraph);
    this.files = project.getChildNodes().map(x => x as File);
  }

}
