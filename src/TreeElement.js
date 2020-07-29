import React from 'react';

function TreeElement(props) {
  const children = props.children.map((child, index) => <li key={index}>{child}</li>);
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