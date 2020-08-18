import React from 'react';
import { render, screen } from '@testing-library/react';
import MohioView from './MohioView';


const name = 'definition';
const definition = 'a statement that explains the meaning of a word or phrase';
const mohio = {
  name: name,
  definition: definition,
}

beforeEach(() => {
  render(<MohioView mohio={mohio} />);
});

test("displays the name", () => {
  const nameElement = screen.getByText(name);
  expect(nameElement).toBeInTheDocument();
});

test("displays the definition", () => {
  const definitionElement = screen.getByText(definition);
  expect(definitionElement).toBeInTheDocument();
});