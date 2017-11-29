export class Config {
  /**
   * HTTP Port where the app runs.
   */
  static httpPort: string = process.env.ES_HTTP_PORT || '9094';
}