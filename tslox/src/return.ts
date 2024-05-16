export default class ReturnException extends Error {
  constructor(public readonly value: unknown) {
    super();
  }
}
