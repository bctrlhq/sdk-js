import {
  V1AccountClient,
  V1ApiKeysClient,
  V1AuthClient,
  V1SubaccountsClient,
  V1UsageClient,
} from './account.js';
import { V1AiClient } from './ai.js';
import { V1BrowserExtensionsClient } from './browserExtensions.js';
import { isControllerBusy } from './errors.js';
import { V1FilesClient } from './files.js';
import { V1HelpClient } from './help.js';
import { V1HttpClient, type V1ClientOptions } from './http.js';
import { V1NotificationRecipientsClient } from './notificationRecipients.js';
import { V1ProxiesClient } from './proxies.js';
import { V1RunsClient } from './runs.js';
import { V1RuntimesClient } from './runtimes.js';
import { V1SpacesClient } from './spaces.js';
import { V1ToolCallsClient } from './toolCalls.js';
import { V1ToolsClient } from './tools.js';
import { V1ToolsetsClient } from './toolsets.js';
import { V1VaultClient } from './vault.js';

export type BctrlV1Options = V1ClientOptions;

export class BctrlV1 {
  private readonly options: BctrlV1Options;
  private readonly http: V1HttpClient;
  private _spaces: V1SpacesClient | null = null;
  private _runtimes: V1RuntimesClient | null = null;
  private _runs: V1RunsClient | null = null;
  private _files: V1FilesClient | null = null;
  private _help: V1HelpClient | null = null;
  private _tools: V1ToolsClient | null = null;
  private _toolsets: V1ToolsetsClient | null = null;
  private _toolCalls: V1ToolCallsClient | null = null;
  private _vault: V1VaultClient | null = null;
  private _proxies: V1ProxiesClient | null = null;
  private _browserExtensions: V1BrowserExtensionsClient | null = null;
  private _ai: V1AiClient | null = null;
  private _account: V1AccountClient | null = null;
  private _apiKeys: V1ApiKeysClient | null = null;
  private _auth: V1AuthClient | null = null;
  private _subaccounts: V1SubaccountsClient | null = null;
  private _usage: V1UsageClient | null = null;
  private _notificationRecipients: V1NotificationRecipientsClient | null = null;

  static isControllerBusy(error: unknown): boolean {
    return isControllerBusy(error);
  }

  constructor(options: BctrlV1Options = {}) {
    this.options = { ...options };
    this.http = new V1HttpClient(this.options);
  }

  withSubaccount(subaccountId: string): BctrlV1 {
    return new BctrlV1({ ...this.options, subaccountId });
  }

  get spaces(): V1SpacesClient {
    this._spaces ??= new V1SpacesClient(this.http);
    return this._spaces;
  }

  get runtimes(): V1RuntimesClient {
    this._runtimes ??= new V1RuntimesClient(this.http);
    return this._runtimes;
  }

  get runs(): V1RunsClient {
    this._runs ??= new V1RunsClient(this.http);
    return this._runs;
  }

  get files(): V1FilesClient {
    this._files ??= new V1FilesClient(this.http);
    return this._files;
  }

  get help(): V1HelpClient {
    this._help ??= new V1HelpClient(this.http);
    return this._help;
  }

  get tools(): V1ToolsClient {
    this._tools ??= new V1ToolsClient(this.http);
    return this._tools;
  }

  get toolsets(): V1ToolsetsClient {
    this._toolsets ??= new V1ToolsetsClient(this.http);
    return this._toolsets;
  }

  get toolCalls(): V1ToolCallsClient {
    this._toolCalls ??= new V1ToolCallsClient(this.http);
    return this._toolCalls;
  }

  get vault(): V1VaultClient {
    this._vault ??= new V1VaultClient(this.http);
    return this._vault;
  }

  get proxies(): V1ProxiesClient {
    this._proxies ??= new V1ProxiesClient(this.http);
    return this._proxies;
  }

  get browserExtensions(): V1BrowserExtensionsClient {
    this._browserExtensions ??= new V1BrowserExtensionsClient(this.http);
    return this._browserExtensions;
  }

  get ai(): V1AiClient {
    this._ai ??= new V1AiClient(this.http);
    return this._ai;
  }

  get account(): V1AccountClient {
    this._account ??= new V1AccountClient(this.http);
    return this._account;
  }

  get apiKeys(): V1ApiKeysClient {
    this._apiKeys ??= new V1ApiKeysClient(this.http);
    return this._apiKeys;
  }

  get auth(): V1AuthClient {
    this._auth ??= new V1AuthClient(this.http);
    return this._auth;
  }

  get subaccounts(): V1SubaccountsClient {
    this._subaccounts ??= new V1SubaccountsClient(this.http);
    return this._subaccounts;
  }

  get usage(): V1UsageClient {
    this._usage ??= new V1UsageClient(this.http);
    return this._usage;
  }

  get notificationRecipients(): V1NotificationRecipientsClient {
    this._notificationRecipients ??= new V1NotificationRecipientsClient(this.http);
    return this._notificationRecipients;
  }
}

export { BctrlV1 as Bctrl };
