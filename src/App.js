import React from 'react';
import './App.css'
import NavigationBar from './NavigationBar';
import MohioNavigationTree from './MohioNavigationTree';
import MohioView from './MohioView';

function App() {
  return (
    <div className="App">
      <header>
        <NavigationBar></NavigationBar>
      </header>
      <nav>
        <MohioNavigationTree></MohioNavigationTree>
      </nav>
      <article>
        <MohioView></MohioView>
      </article>
    </div>
  );
}

export default App;
