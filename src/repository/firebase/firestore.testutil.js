import axios from 'axios';

export async function clearFirestore() {
  return axios.delete('http://localhost:8080/emulator/v1/projects/mohio-app/databases/(default)/documents');
}