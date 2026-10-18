import { BctrlClient } from './generated/fern/Client.js';
import { Browsers } from './lib/browsers.js';
import { Conversations } from './lib/conversations.js';

/** The generated client, with browser and conversation helpers on their resources. */
export class Bctrl extends BctrlClient {
  override get browsers(): Browsers {
    return (this._browsers ??= new Browsers(this._options)) as Browsers;
  }

  override get conversations(): Conversations {
    return (this._conversations ??= new Conversations(this._options)) as Conversations;
  }
}
