import React from 'react';
import './MohioNavigationTree.css';

function MohioNavigationTree() {
  return (
    <div className="MohioNavigationTree">
      <ul>
        <li>
          <a href="#">Components</a>
          <ul>
            <li><a href="#">Components</a></li>
          </ul>
        </li>
        <li>
          <a href="#">Link</a>
        </li>
        <li>
          <a href="#">Link</a>
        </li>
        <li >
          <a href="#">Link</a>
        </li>
      </ul>
    </div>
  );
}

export default MohioNavigationTree;
