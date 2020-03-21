import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { AbstractSyntaxGraph, DataNode, Backend, File, PropertyNode } from 'dsl-compiler-collection';

@Component({
  selector: 'app-dslcompiler-collection',
  templateUrl: './dslcompiler-collection.component.html',
  styleUrls: ['./dslcompiler-collection.component.scss']
})
export class DSLCompilerCollectionComponent {

  public files: File[];

  public formGroup = this.fb.group({
    name: null,
    property: null,
  });

  constructor(private fb: FormBuilder) { }

  onSubmit() {
    console.info(this.formGroup.value)
    const abstractSyntaxGraph = new AbstractSyntaxGraph();
    const dataNode = new DataNode(this.formGroup.value.name);
    dataNode.appendChildNode(new PropertyNode(this.formGroup.value.property, PropertyNode.TYPE_TEXT));
    abstractSyntaxGraph.appendChildNode(dataNode);
    const backend = new Backend();
    const project = backend.generate(abstractSyntaxGraph);
    this.files = project.getChildNodes().map(x => x as File);
  }

}
