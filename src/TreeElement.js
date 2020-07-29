import React from 'react';

function TreeElement(props) {
  let children = null;
  if (props.children && props.children.length > 0) {
    children = props.children.map((child, index) => <li key={index}>{child}</li>);
  }
  return (
    <div>
      {props.title}
      <ul>
        {children}
      </ul>
    </div>
  );
}

export default TreeElement;