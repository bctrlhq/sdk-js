import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export interface V1ListEnvelope<T> {
  data: T[];
  nextCursor: string | null;
}

export interface V1PageQuery {
  cursor?: string;
  limit?: number;
}

export type {
  V1AccountUsage,
  V1ApiKey,
  V1ApiKeyCreateRequest,
  V1ApiKeyCreateResponse,
  V1ApiKeyDeleteResponse,
  V1ApiKeyListQuery,
  V1AuthScope,
  V1AuthWhoamiResponse,
  V1Plan,
  V1Subaccount,
  V1SubaccountArchiveResponse,
  V1SubaccountCreateRequest,
  V1SubaccountGetQuery,
  V1SubaccountLimits,
  V1SubaccountListQuery,
  V1SubaccountUpdateRequest,
  V1SubaccountUsage,
  V1SubaccountUsageListQuery,
  V1SubaccountUsageListResponse,
} from './accountTypes.js';

export type {
  V1AiCredential,
  V1AiCredentialCreateRequest,
  V1AiCredentialDeleteResponse,
  V1AiCredentialListQuery,
  V1AiCredentialProvider,
  V1AiCredentialStatus,
  V1AiCredentialTestResponse,
  V1AiCredentialUpdateRequest,
  V1AiModel,
  V1AiModelEngine,
  V1AiModelListQuery,
  V1AiModelListResponse,
  V1AiModelStatus,
  V1AiStoredModelSelection,
  V1AiStoredModelSelectionAuth,
} from './aiTypes.js';

export type {
  V1BrowserExtension,
  V1BrowserExtensionDeleteResponse,
  V1BrowserExtensionFormat,
  V1BrowserExtensionImportRequest,
  V1BrowserExtensionListQuery,
  V1BrowserExtensionSource,
  V1BrowserExtensionUpdateRequest,
  V1BrowserExtensionUploadRequest,
} from './browserExtensionTypes.js';

export type {
  V1ToolCall,
  V1ToolCallCallerType,
  V1ToolCallListQuery,
  V1ToolCallStatus,
  V1ToolName,
} from './toolCallTypes.js';

export type {
  V1Toolset,
  V1ToolsetCreateRequest,
  V1ToolsetDeleteResponse,
  V1ToolsetListQuery,
  V1ToolsetToolName,
  V1ToolsetUpdateRequest,
} from './toolsetTypes.js';

export type V1HelpAudience = NonNullable<OpenApiQuery<'help'>['audience']>;
export type V1HelpRequest = OpenApiQuery<'help'>;
export type V1HelpField = OpenApiSchemas['HelpField'];
export type V1HelpFlag = OpenApiSchemas['HelpFlag'];
export type V1HelpIo = OpenApiSchemas['HelpIo'];
export type V1HelpApiOperation = OpenApiSchemas['HelpApiOperation'];
export type V1HelpSdkMethod = OpenApiSchemas['HelpSdkMethod'];
export type V1HelpCliCommand = OpenApiSchemas['HelpCliCommand'];
export type V1HelpExample = OpenApiSchemas['HelpExample'];
export type V1HelpNextStep = OpenApiSchemas['HelpNextStep'];
export type V1HelpTopic = OpenApiSchemas['HelpTopic'];
export type V1HelpOverviewResponse = OpenApiSchemas['HelpOverviewResponse'];
export type V1HelpTopicResponse = OpenApiSchemas['HelpTopicResponse'];
export type V1HelpResponse = OpenApiSchemas['HelpResponse'];

export type V1SpaceListQuery = OpenApiQuery<'spaces.list'>;
export type V1SpaceCreateRequest = OpenApiSchemas['SpaceCreateRequest'];
export type V1SpaceUpdateRequest = OpenApiSchemas['SpaceUpdateRequest'];
export type V1Space = OpenApiSchemas['Space'];
export type V1SpaceDeleteResponse = OpenApiSchemas['SpaceDeleteResponse'];
export type V1SpaceStorageMount = OpenApiSchemas['EnvironmentStorageMountOutput'];
export type V1SpaceVaultMount = NonNullable<OpenApiSchemas['EnvironmentMountsOutput']['vault']>;
export type V1SpaceAiMount = NonNullable<OpenApiSchemas['EnvironmentMountsOutput']['ai']>;
export type V1SpaceEnvironment = OpenApiSchemas['EnvironmentMountsOutput'];
export type V1SpaceAiMountUpdate = NonNullable<
  OpenApiSchemas['SpaceEnvironmentUpdateRequest']['ai']
>;
export type V1SpaceEnvironmentUpdateRequest = OpenApiSchemas['SpaceEnvironmentUpdateRequest'];

export type V1RuntimeType = OpenApiSchemas['RuntimeSummary']['type'];
export type V1RuntimeStatus = OpenApiSchemas['RuntimeSummary']['status'];
export type V1BrowserStealth = NonNullable<OpenApiSchemas['BrowserRuntimeCreateConfig']['stealth']>;
export type V1ProxyInput = OpenApiSchemas['RuntimeProxyInput'];
export type V1RuntimeFingerprintCreateConfig = NonNullable<
  OpenApiSchemas['BrowserRuntimeCreateConfig']['fingerprint']
>;
export type V1BrowserNetworkTrafficSaver = NonNullable<
  OpenApiSchemas['BrowserNetworkTrafficConfig']['saver']
>;
export type V1BrowserNetworkTrafficResourceType = NonNullable<
  OpenApiSchemas['BrowserNetworkTrafficConfig']['blockResourceTypes']
>[number];
export type V1BrowserNetworkTrafficConfig = OpenApiSchemas['BrowserNetworkTrafficConfig'];
export type V1BrowserRuntimeCreateConfig = OpenApiSchemas['BrowserRuntimeCreateConfig'];
export type V1BrowserRuntimeConfig = OpenApiSchemas['BrowserRuntimeConfig'];
export type V1RuntimeFingerprint = OpenApiSchemas['RuntimeFingerprint'];
export type V1RuntimeCreateRequest = OpenApiSchemas['RuntimeCreateRequest'];
export type V1SpaceRuntimeCreateRequest = Omit<V1RuntimeCreateRequest, 'spaceId'>;
export type V1RuntimeUpdateRequest = OpenApiSchemas['RuntimeUpdateRequest'];
export type V1RuntimeDeleteResponse = OpenApiSchemas['RuntimeDeleteResponse'];
export type V1RuntimeListQuery = OpenApiQuery<'runtimes.list'>;
export type V1RuntimeSummary = OpenApiSchemas['RuntimeSummary'];
export type V1Runtime = OpenApiSchemas['RuntimeDetail'];
export type V1RuntimeCreateResponse = OpenApiSchemas['RuntimeCreateResponse'];
export type V1RuntimeStartResponse = OpenApiSchemas['RuntimeStartResponse'];
export type V1RuntimeStopResponse = OpenApiSchemas['RuntimeStopResponse'];

export type V1RunListQuery = OpenApiQuery<'runs.list'>;
export type V1RunSummary = OpenApiSchemas['RunSummary'];
export type V1Run = OpenApiSchemas['Run'];
export type V1RunUsage = OpenApiSchemas['RunUsage'];
export type V1RunEvent = OpenApiSchemas['RunEvent'];
export type V1RunEventsListQuery = OpenApiQuery<'runs.events.list'>;
export type V1TraceSpan = OpenApiSchemas['TraceSpan'];
export type V1RunTraceListQuery = OpenApiQuery<'runs.trace.list'>;
export type V1RunStreamEvent = OpenApiSchemas['RunStreamEvent'];
export type V1RunStreamQuery = OpenApiQuery<'runs.stream'>;
export type V1RunFile = OpenApiSchemas['RunFile'];

export type V1File = OpenApiSchemas['File'];
export type V1FilesListQuery = OpenApiQuery<'files.list'>;
export type V1FileFolder = OpenApiSchemas['FileFolder'];
export type V1FilesListResponse = OpenApiSchemas['FileListResponse'];
export type V1FileUpdateRequest = OpenApiSchemas['FileUpdateRequest'];
export type V1FileDeleteResponse = OpenApiSchemas['FileDeleteResponse'];
export interface V1FileUploadRequest {
  spaceId?: string;
  file: Blob;
  name?: string;
  path?: string;
  metadata?: JsonObject;
}

export type V1Account = OpenApiSchemas['Account'];
export type V1AccountPatchRequest = OpenApiSchemas['AccountPatchRequest'];
export type V1AccountUpdateQuery = OpenApiQuery<'account.update'>;

export type V1Agent = OpenApiSchemas['Agent'];
export type V1AgentListQuery = V1PageQuery;
export type V1Conversation = OpenApiSchemas['Conversation'];
export type V1ConversationDetail = OpenApiSchemas['ConversationDetail'];
export type V1ConversationCreateRequest = OpenApiSchemas['ConversationCreateRequest'];
export type V1ConversationMessageCreateRequest =
  OpenApiSchemas['ConversationMessageCreateRequest'];
export type V1ConversationTurn = OpenApiSchemas['AgentTurnAccepted'];
export type V1ConversationCancelResponse = OpenApiSchemas['ConversationCancelResponse'];
export type V1ConversationEvent = OpenApiSchemas['ConversationEvent'];
export type V1ConversationStreamEvent = OpenApiSchemas['ConversationEvent'];
export type V1ConversationListQuery = OpenApiQuery<'conversations.list'>;
export type V1ConversationStreamQuery = OpenApiQuery<'conversations.stream'>;
export type V1Message = OpenApiSchemas['Message'];

export type V1View = OpenApiSchemas['View'];
export type V1ViewCreateRequest = OpenApiSchemas['ViewCreateRequest'];
export type V1ViewCreateResponse = OpenApiSchemas['ViewCreateResponse'];
export type V1ViewDeleteResponse = OpenApiSchemas['ViewDeleteResponse'];
export type V1ViewSessionCreateRequest = OpenApiSchemas['ViewSessionCreateRequest'];
export type V1ViewSession = OpenApiSchemas['ViewSession'];
export type V1ViewsListQuery = OpenApiQuery<'views.list'>;

export type V1Webhook = OpenApiSchemas['Webhook'];
export type V1WebhookCreateRequest = OpenApiSchemas['WebhookCreateRequest'];
export type V1WebhookCreateResponse = OpenApiSchemas['WebhookCreateResponse'];
export type V1WebhookUpdateRequest = OpenApiSchemas['WebhookUpdateRequest'];
export type V1WebhookDeleteResponse = OpenApiSchemas['WebhookDeleteResponse'];
export type V1WebhookDelivery = OpenApiSchemas['WebhookDelivery'];
export type V1WebhookRotateSecretResponse = OpenApiSchemas['WebhookRotateSecretResponse'];
export type V1WebhooksListQuery = OpenApiQuery<'webhooks.list'>;
export type V1WebhookDeliveriesListQuery = OpenApiQuery<'webhooks.deliveries.list'>;

export type V1NotificationRecipient = OpenApiSchemas['NotificationRecipient'];
export type V1NotificationRecipientCreateRequest =
  OpenApiSchemas['NotificationRecipientCreateRequest'];
export type V1NotificationRecipientUpdateRequest =
  OpenApiSchemas['NotificationRecipientUpdateRequest'];
export type V1NotificationRecipientDeleteResponse =
  OpenApiSchemas['NotificationRecipientDeleteResponse'];
export type V1NotificationRecipientListQuery = OpenApiQuery<'notification-recipients.list'>;

export type {
  V1ManagedRotatingDevice,
  V1ManagedRotatingPreference,
  V1ManagedRotatingProxyConfig,
  V1ManagedRotatingRotation,
  V1Proxy,
  V1ProxyBase,
  V1ProxyCreateRequest,
  V1ProxyDeleteResponse,
  V1ProxyDnsResolution,
  V1ProxyListQuery,
  V1ProxyPool,
  V1ProxyPoolListQuery,
  V1ProxyProtocol,
  V1ProxyTestResponse,
  V1ProxyType,
  V1ProxyUpdateRequest,
} from './proxyTypes.js';

export type V1Tool = OpenApiSchemas['Tool'];
export type V1ToolCreateRequest = OpenApiSchemas['ToolCreateRequest'];
export type V1ToolUpdateRequest = OpenApiSchemas['ToolUpdateRequest'];
export type V1ToolListQuery = OpenApiQuery<'tools.list'>;
export type V1ToolCallRequest = {
  input?: unknown;
  runtimeId?: string;
  runId?: string;
  parentId?: string;
  executionMode?: 'sync' | 'async';
};
export type V1ToolCallResult = JsonValue;
export type V1ToolCallResponseRequest = { response: unknown };
export type V1ToolCallResultQuery = OpenApiQuery<'tool-calls.result'>;
