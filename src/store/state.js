export class StateWrapper {
  constructor(state) {
    this.state = state;
  }

  get mohios() {
    return this.state.mohios;
  }

  set mohios(mohios) {
    this.state.mohios = mohios;
  }

  get view() {
    return this.mohios.view;
  }

  set view(mohio) {
    this.mohios.view = mohio;
  }
}

export function getView(state) {
  const wrapper = new StateWrapper(state);
  return wrapper.view;
}
