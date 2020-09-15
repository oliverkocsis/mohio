import db from './firebase/firestore';

const collectionNameMohios = 'mohios'
const collectionNameRoots = `roots`

export async function readMohios() {
  return getCollectionMohios().then((querySnapshot) => {
    return querySnapshot.docs.map((doc) => {
      return {
        ...doc.data(),
        id: doc.id,
      }
    });
  });
}

export async function readMohio(id) {
  return getDocumentMohio(id).then((doc) => {
    if (!doc.exists) {
      throw new Error(`Mohio does not exist: ${id}`);
    }
    return {
      ...doc.data(),
      id: doc.id,
    }
  });
}

export function readRoots() {
  return getCollectionRoots().then((querySnapshot) => {
    return querySnapshot.docs.map((doc) => doc.id);
  });
}

export async function create(mohio, parentId = null) {
  const id = await addToCollectionMohios(mohio).then((docRef) => docRef.id);
  if (parentId) {
    const parent = await readMohio(parentId);
    if (!parent.children) {
      parent.children = [];
    }
    if (!parent.children.includes(id)) {
      parent.children.push(id);
    }
    updateMohio(parent);
  } else {
    addToCollectionRoots(id);
  }
  return id;
}

export async function updateMohio(mohio) {
  const mohioWithoutId = { ...mohio };
  delete mohioWithoutId.id;
  return documentMohio(mohio.id).update(mohioWithoutId);
}

function collectionMohios() {
  return db.collection(collectionNameMohios);
}

function documentMohio(id) {
  return db.collection(collectionNameMohios).doc(id);
}

async function getCollectionMohios() {
  return collectionMohios().get();
}

async function getDocumentMohio(id) {
  return documentMohio(id).get();
}

async function addToCollectionMohios(mohio) {
  return collectionMohios().add(mohio);
}

function collectionRoots() {
  return db.collection(collectionNameRoots);
}

async function getCollectionRoots() {
  return collectionRoots().get();
}

async function addToCollectionRoots(id) {
  return collectionRoots().doc(id).set({});
}