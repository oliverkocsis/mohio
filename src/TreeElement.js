import React from 'react';

function TreeElement(props) {
  let children = null;
  if (props.children && props.children.length > 0) {
    children = renderChildren(props.children);
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

function renderChildren(children) {
  return children.map((child, index) => {
    if (typeof child === 'string') {
      return renderFlatChild(child, index);
    } else {
      return renderMultiLevelChild(child, index);
    }
  });
}

function renderFlatChild(title, index) {
  return <li key={index}>{title}</li>;
}

function renderMultiLevelChild(element, index) {
  let children = null;
  if (element.children && element.children.length > 0) {
    children = renderChildren(element.children);
  }
  return (
    <li key={index}>{element.title}
      <ul>
        {children}
      </ul>
    </li>
  );
}

export default TreeElement;