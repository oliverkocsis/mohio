import * as mohioRepository from '../repository/mohioRepository';
import { clearFirestore } from '../repository/firebase/firestore.testutil';

const mohioLoremIpsum = {
  name: 'Lorem ipsum',
  definition: 'Lorem ipsum dolor sit amet',
}

const mohioConsecteturAdipiscingElit = {
  name: 'Consectetur Adipiscing',
  definition: 'Consectetur adipiscing elit',
}

export const Given = {
  mohioLoremIpsumId: null,
  mohioConsecteturAdipiscingElitId: null,

  async FirestoreIsEmpty() {
    return clearFirestore();
  },

  async MohiosCreatedInRepository() {
    this.mohioLoremIpsumId = await mohioRepository.create(mohioLoremIpsum);
    this.mohioConsecteturAdipiscingElitId = await mohioRepository.create(mohioConsecteturAdipiscingElit, this.mohioLoremIpsumId);
  },

  mohioMohioLoremIpsumWithId() {
    return {
      id: this.mohioLoremIpsumId,
      ...mohioLoremIpsum,
    }
  },

  mohioConsecteturAdipiscingElitWithId() {
    return {
      id: this.mohioConsecteturAdipiscingElitId,
      ...mohioConsecteturAdipiscingElit,
    }
  },
}