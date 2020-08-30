import app from './firebase';

test("app is initialized by default", () => {
  expect(app).toBeDefined();
});