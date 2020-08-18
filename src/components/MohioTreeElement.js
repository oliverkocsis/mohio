import React from 'react';
import MohioTreeElementFlat from './MohioTreeElementFlat'
import MohioTreeElementMultiLevel from './MohioTreeElementMultiLevel';

function MohioTreeElement(props) {
  const children = props.children;
  if (children) {
    return <MohioTreeElementMultiLevel name={props.name} children={children} onClick={props.onClick} />
  } else {
    return <MohioTreeElementFlat name={props.name} onClick={props.onClick} />
  }

}

export default MohioTreeElement;