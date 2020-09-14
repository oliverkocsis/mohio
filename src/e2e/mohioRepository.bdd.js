import * as repository from '../repository/mohioRepository';
import { Given as GivenFirestoreClass } from '../repository/firebase/firestore.bdd';

export const mohioLoremIpsum = {
  name: 'Lorem Ipsum',
  definition: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
}

export const mohioCrasEgestas = {
  name: 'Cras Egestas',
  definition: 'Cras egestas lorem quis ex accumsan, ac hendrerit felis efficitur.',
}

export const mohioNullaAt = {
  name: "Nulla At",
  definition: "",
}

export class Given {
  constructor() {
    this.mohioLoremIpsumId = null;
    this.mohioCrasEgestasId = null;
    this.mohioNullaAtId = null;
    this.GivenFirestore = new GivenFirestoreClass();
  }

  async RepositoryIsEmpty() {
    return this.GivenFirestore.FirestoreIsEmpty();
  }

  async RootMohioIsCreated() {
    this.mohioLoremIpsumId = await repository.create(mohioLoremIpsum);
    return this.mohioLoremIpsumId;
  }

  async ChildOfRootMohioIsCreatedy() {
    this.mohioCrasEgestasId = await repository.create(mohioCrasEgestas, this.mohioLoremIpsumId);
    return this.mohioCrasEgestasId;
  }

  async ChildOfChildMohioIsCreatedy() {
    this.mohioNullaAtId = await repository.create(mohioNullaAt, this.mohioNullaAtId);
    return this.mohioNullaAtId;
  }

  get rootMohioId() { return this.mohioLoremIpsumId }

  get childOfRootMohioId() { return this.mohioCrasEgestasId }

  get childOfChildMohioId() { return this.mohioNullaAtId }

  get rootMohio() { return { ...mohioLoremIpsum, id: this.rootMohioId } }

  get childOfRootMohio() { return { ...mohioCrasEgestas, id: this.childOfRootMohioId } }

  get childOfChildMohio() { return { ...mohioNullaAt, id: this.childOfChildMohioId } }

}