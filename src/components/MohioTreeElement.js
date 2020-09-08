import React from 'react';
import MohioTreeElementFlat from './MohioTreeElementFlat'
import MohioTreeElementMultiLevel from './MohioTreeElementMultiLevel';

function MohioTreeElement(props) {
  const mohio = props.mohio;
  if (mohio.children) {
    return <MohioTreeElementMultiLevel mohio={mohio} />
  } else {
    return <MohioTreeElementFlat mohio={mohio} />
  }

}

export default MohioTreeElement;