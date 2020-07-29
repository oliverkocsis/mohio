import React from 'react';
import TreeElement from './TreeElement';

function App() {
  const title = 'The Raven';
  const children = ['Once upon a midnight dreary', 'while I pondered', 'weak and weary', 'Over many a quaint and curious volume of forgotten lore'];
  return (
    <div><TreeElement title={title} children={children} /></div>
  );
}

export default App;
