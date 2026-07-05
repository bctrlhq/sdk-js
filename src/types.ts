export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

import type {
  V1ManagedRotatingProxyConfig,
  V1ProxyDnsResolution,
  V1ProxyProtocol,
} from './proxyTypes.js';
import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

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
  V1AiModelSelection,
  V1AiModelSelectionAuth,
  V1AiModelSelectionObject,
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
  V1ToolCallActor,
  V1ToolCallListQuery,
  V1ToolCallStatus,
  V1ToolCallTool,
} from './toolCallTypes.js';

export type {
  V1Toolset,
  V1ToolsetBuiltinName,
  V1ToolsetCreateRequest,
  V1ToolsetDeleteResponse,
  V1ToolsetListQuery,
  V1ToolsetUpdateRequest,
} from './toolsetTypes.js';

export interface V1ListEnvelope<T> {
  data: T[];
  nextCursor: string | null;
}

export interface V1PageQuery {
  cursor?: string;
  limit?: number;
}

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

export type V1RuntimeType = OpenApiSchemas['Runtime']['type'];
export type V1RuntimeStatus = OpenApiSchemas['Runtime']['status'];
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
export type V1RuntimeCreateRequest = OpenApiSchemas['RuntimeCreateRequest'];

export type V1SpaceRuntimeCreateRequest = Omit<V1RuntimeCreateRequest, 'spaceId'>;

/** PATCH /v1/runtimes/{runtimeId} — name and idleTimeoutSeconds are editable
 * any time; `config` only while the runtime is stopped. */
export type V1RuntimeUpdateRequest = OpenApiSchemas['RuntimeUpdateRequest'];

export type V1RuntimeDeleteResponse = OpenApiSchemas['RuntimeDeleteResponse'];

export interface V1RuntimeListQuery {
  spaceId?: string;
  status?: V1RuntimeStatus | V1RuntimeStatus[];
  cursor?: string;
  limit?: number;
}

export type V1RuntimeSummary = OpenApiSchemas['RuntimeSummary'];

/** Saved-resource reference for a proxy attached to a runtime (response side). */
export interface V1RuntimeProxyRef {
  id: string;
  type: 'custom' | 'managed-rotating' | 'managed-static';
  name: string;
}

export type V1RuntimeInlineProxyConfig =
  | {
      type: 'custom';
      protocol: V1ProxyProtocol;
      dnsResolution?: V1ProxyDnsResolution;
      host: string;
      port: number;
      username?: string | null;
      hasPassword: boolean;
    }
  | ({ type: 'managed-rotating' } & V1ManagedRotatingProxyConfig);

/** Resolved fingerprint reported on a runtime's config (response side). */
export type V1RuntimeFingerprint = OpenApiSchemas['RuntimeFingerprint'];

/**
 * Type-specific browser runtime config returned on the runtime resource. No open
 * JSON fallback arm — only the documented browser knobs are surfaced.
 */
export type V1BrowserRuntimeConfig = OpenApiSchemas['BrowserRuntimeConfig'];

export type V1Runtime = OpenApiSchemas['Runtime'];

export interface V1RuntimeStartRuntime {
  id: string;
  spaceId: string;
  name: string;
  type: V1RuntimeType;
  status: V1RuntimeStatus;
}

export interface V1RuntimeStartRun extends V1RunSummary {
  durationSeconds?: number | null;
  failureReason?: string | null;
}

export type V1ConnectionProtocol = 'cdp';

export type V1RuntimeStartResponse = OpenApiSchemas['RuntimeStartResponse'];

export type V1RuntimeStopResponse = OpenApiSchemas['RuntimeStopResponse'];

export interface V1RunListQuery extends V1PageQuery {
  status?: string | string[];
  spaceId?: string;
  runtimeId?: string;
}

export type V1RuntimeRunListQuery = Omit<V1RunListQuery, 'spaceId' | 'runtimeId'>;

export type V1RunSummary = OpenApiSchemas['RunSummary'];

export type V1Run = OpenApiSchemas['Run'];

export type V1RunUsageBillingStatus = 'pending' | 'settled' | 'unavailable';

export type V1RunUsage = OpenApiSchemas['RunUsage'];

export type V1RunEventType = OpenApiSchemas['RunEvent']['type'];

export type V1RunEventStatus = NonNullable<OpenApiSchemas['RunEvent']['status']>;

export type V1RunEvent = OpenApiSchemas['RunEvent'];

export type V1RunEventsListQuery = OpenApiQuery<'runs.events.list'>;

export interface V1RunStreamHeartbeat {
  time: string;
}

export interface V1RunStreamEnded {
  runId: string;
  status: V1Run['status'];
  finishedAt: string | null;
  failure: NonNullable<V1Run['failure']> | null;
}

export type V1RunEventStreamFrame =
  | { event: 'run.event'; id: string; data: V1RunEvent }
  | { event: 'heartbeat'; data: V1RunStreamHeartbeat }
  | { event: 'run.ended'; data: V1RunStreamEnded };

export type V1RunActivityCategory =
  | 'runtime'
  | 'browser'
  | 'network'
  | 'console'
  | 'file'
  | 'invocation'
  | 'tool'
  | 'captcha'
  | 'agent'
  | 'llm'
  | 'system';
export type V1RunActivitySeverity = 'info' | 'warning' | 'error';

export interface V1RunActivityLinks {
  invocationId?: string;
  toolCallId?: string;
  fileId?: string;
}

export type V1RunActivityItem = OpenApiSchemas['RunActivityItem'];

export type V1RunActivityListQuery = OpenApiQuery<'runs.activity.list'>;

export type V1RunActivityStreamFrame =
  | { event: 'run.activity'; id: string; data: V1RunActivityItem }
  | { event: 'heartbeat'; data: V1RunStreamHeartbeat }
  | { event: 'run.ended'; data: V1RunStreamEnded };

export type V1RunLiveRequest = OpenApiSchemas['RunLiveRequest'];

export type V1RunLiveResponse = OpenApiSchemas['RunLiveResponse'];

export type V1RunRecordingRequest = OpenApiSchemas['RunRecordingRequest'];

export type V1RunRecordingResponse = OpenApiSchemas['RunRecordingResponse'];

export type V1InvocationAction = OpenApiSchemas['Invocation']['action'];
export type V1RuntimeTargetSelector = OpenApiSchemas['RuntimeTargetSelector'];

export type V1RuntimeTarget = OpenApiSchemas['RuntimeTarget'];

export type V1RuntimeTargetCreateRequest = OpenApiSchemas['RuntimeTargetCreateRequest'];
export type V1InvocationErrorCode = NonNullable<
  NonNullable<OpenApiSchemas['Invocation']['error']>['code']
>;

export type V1InvocationError = NonNullable<OpenApiSchemas['Invocation']['error']>;

export type V1Invocation = OpenApiSchemas['Invocation'];

// Single-item GET / cancel / create return the bare resource (no `{ data }`).
export type V1InvocationResponse = V1Invocation;

export type V1InvocationWaitRequest = OpenApiSchemas['InvocationWaitRequest'];

export type V1InvocationWaitResponse = OpenApiSchemas['InvocationWait'];

// Lean summary for the run-scoped observability list.
export type V1InvocationSummary = OpenApiSchemas['InvocationSummary'];

export type V1RunInvocationsListQuery = OpenApiQuery<'runs.invocations.list'>;

export interface V1RuntimeInvocationFileInput {
  fileId: string;
  runtimePath?: string;
  name?: string;
}

export type V1RuntimeInvocationCreateRequest = OpenApiSchemas['RuntimeInvocationCreateRequest'];

export type V1RuntimeInvocationManagedTools = NonNullable<
  Extract<V1RuntimeInvocationCreateRequest, { action: 'browserUse' }>['tools']
>;

export type V1File = OpenApiSchemas['File'];

export type V1FilesListQuery = OpenApiQuery<'files.list'>;

/** Immediate-subfolder rollup returned by files.list with `include: 'folders'`. */
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

export type V1RunFilesListQuery = OpenApiQuery<'runs.files.list'>;

export type V1RuntimeFilesListQuery = OpenApiQuery<'runtimes.files.list'>;

export type V1RunFilesExportRequest = OpenApiSchemas['RunsFilesExportRequest'];

export type V1RuntimeFileStageRequest = OpenApiSchemas['RuntimeFileStageRequest'];

export type V1RuntimeStagedFile = OpenApiSchemas['RuntimeStagedFile'];

export interface V1RuntimeFileUploadRequest {
  file: Blob;
  name?: string;
  /** Durable BCTRL storage destination. */
  destinationPath?: string;
  runtimePath?: string;
  metadata?: JsonObject;
}

export type V1RuntimeFileCollectRequest = OpenApiSchemas['RuntimeFileCollectRequest'];

export type V1HumanAction = OpenApiSchemas['HumanAction'];

export type V1HumanActionCreateRequest = OpenApiSchemas['HumanActionCreateRequest'];

export type V1HumanActionWaitRequest = OpenApiSchemas['HumanActionWaitRequest'];

export type V1HumanActionWaitResponse = OpenApiSchemas['HumanActionWait'];

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

export type {
  V1VaultSecret,
  V1VaultSecretDeleteResponse,
  V1VaultSecretListQuery,
  V1VaultSecretPatchRequest,
  V1VaultSecretType,
  V1VaultSecretUpsertRequest,
  V1VaultSecretValue,
  V1VaultTotpResponse,
} from './vaultTypes.js';

export type V1ToolExecutionType = OpenApiSchemas['ToolCallTool']['executionType'];

export type V1ToolExecution =
  | {
      type: 'webhook';
      url: string;
      auth?: { type: 'none' } | { type: 'hmac'; secretId: string };
      timeoutSeconds?: number;
    }
  | {
      type: 'hosted_function';
      functionVersionId: string;
      functionId?: string;
    }
  | {
      type: 'mcp_tool';
      serverId: string;
      toolName: string;
    }
  | {
      type: 'hosted_workflow';
      workflowId: string;
    }
  | {
      type: 'bctrl_builtin';
      name: V1RuntimeInvocationManagedTools[number];
    };

export type V1ToolType = OpenApiSchemas['Tool']['type'];

export type V1ToolBase = Pick<
  OpenApiSchemas['BuiltinTool'],
  | 'id'
  | 'spaceId'
  | 'name'
  | 'description'
  | 'inputSchema'
  | 'outputSchema'
  | 'status'
  | 'metadata'
  | 'createdAt'
  | 'updatedAt'
>;

export type V1Tool = OpenApiSchemas['Tool'];

export type V1ToolCreateRequest = OpenApiSchemas['ToolCreateRequest'];

export type V1ToolUpdateRequest = OpenApiSchemas['ToolUpdateRequest'];

export type V1ToolVersion = OpenApiSchemas['ToolVersion'];

export type V1ToolVersionCreateRequest = OpenApiSchemas['ToolVersionCreateRequest'];
