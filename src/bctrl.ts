import { BctrlClient } from './generated/fern/Client.js';
import type { BaseClientOptions } from './generated/fern/BaseClient.js';
import { Browsers } from './browserHelpers.js';
import { Conversations } from './conversationHelpers.js';
import { safeFetcher } from './retries.js';

export class Bctrl extends BctrlClient {
  constructor(options: BaseClientOptions) {
    super({ ...options, fetcher: safeFetcher(options.fetcher) });
  }

  override get browsers(): Browsers {
    return (this._browsers ??= new Browsers(this._options)) as Browsers;
  }

  override get conversations(): Conversations {
    return (this._conversations ??= new Conversations(this._options)) as Conversations;
  }
}
