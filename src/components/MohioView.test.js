import React from 'react';
import { render, screen } from '@testing-library/react';
import MohioView from './MohioView';


const name = 'definition';
const definition = 'a statement that explains the meaning of a word or phrase';
const mohio = {
  name: name,
  definition: definition,
}


test("does not display anything when mohio is not defined or null", () => {
  render(<MohioView />);
});

test("displays the name", () => {
  render(<MohioView mohio={mohio} />);
  const nameElement = screen.getByText(name);
  expect(nameElement).toBeInTheDocument();
});

test("displays the definition", () => {
  render(<MohioView mohio={mohio} />);
  const definitionElement = screen.getByText(definition);
  expect(definitionElement).toBeInTheDocument();
});