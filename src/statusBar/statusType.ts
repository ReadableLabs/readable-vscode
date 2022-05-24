export class StatusType {
  static readonly login = new StatusType(
    "$(account)  Readable: Login",
    "readable.login"
  );
  static readonly enabled = new StatusType(
    "$(check)  Readable: Enabled",
    "readable.disableAutoComplete"
  );

  static readonly disabled = new StatusType(
    "$(circle-slash)  Readable: Disabled",
    "readable.enableAutoComplete"
  );

  static readonly error = new StatusType("$(error)  Readable: Error", "");

  constructor(public readonly text: string, public readonly command: string) {}
}
