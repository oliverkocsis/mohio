export const SELECT_MOHIO = 'SELECT_MOHIO';

export function selectMohio(name) {
  return {
    type: SELECT_MOHIO,
    name
  }
}