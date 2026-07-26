/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Generated from: openapi/sdk-openapi.json
 * Run `pnpm generate:sdk-contracts` to regenerate.
 */
import type { components } from './openapi-types.js';

export interface BuiltinToolInputMap {
  "browser.pages.activate": components['schemas']["BuiltinToolBrowserPagesActivateInput"];
  "browser.pages.close": components['schemas']["BuiltinToolBrowserPagesCloseInput"];
  "browser.pages.get": components['schemas']["BuiltinToolBrowserPagesGetInput"];
  "browser.pages.list": components['schemas']["BuiltinToolBrowserPagesListInput"];
  "browser.pages.open": components['schemas']["BuiltinToolBrowserPagesOpenInput"];
  "captcha.solve": components['schemas']["BuiltinToolCaptchaSolveInput"];
  "files.list": components['schemas']["BuiltinToolFilesListInput"];
  "files.read_text": components['schemas']["BuiltinToolFilesReadTextInput"];
  "human.request": components['schemas']["BuiltinToolHumanRequestInput"];
  "run.files.export": components['schemas']["BuiltinToolRunFilesExportInput"];
  "runtime.files.collect": components['schemas']["BuiltinToolRuntimeFilesCollectInput"];
  "runtime.files.list": components['schemas']["BuiltinToolRuntimeFilesListInput"];
  "runtime.files.stage": components['schemas']["BuiltinToolRuntimeFilesStageInput"];
  "stagehand.act": components['schemas']["BuiltinToolStagehandActInput"];
  "stagehand.extract": components['schemas']["BuiltinToolStagehandExtractInput"];
  "stagehand.observe": components['schemas']["BuiltinToolStagehandObserveInput"];
  "vault.secrets.delete": components['schemas']["BuiltinToolVaultSecretsDeleteInput"];
  "vault.secrets.get": components['schemas']["BuiltinToolVaultSecretsGetInput"];
  "vault.secrets.list": components['schemas']["BuiltinToolVaultSecretsListInput"];
  "vault.secrets.set": components['schemas']["BuiltinToolVaultSecretsSetInput"];
  "vault.secrets.update": components['schemas']["BuiltinToolVaultSecretsUpdateInput"];
  "vault.secrets.value": components['schemas']["BuiltinToolVaultSecretsValueInput"];
  "vault.totp.generate": components['schemas']["BuiltinToolVaultTotpGenerateInput"];
}

export interface BuiltinToolOutputMap {
  "browser.pages.activate": components['schemas']["BuiltinToolBrowserPagesActivateOutput"];
  "browser.pages.close": components['schemas']["BuiltinToolBrowserPagesCloseOutput"];
  "browser.pages.get": components['schemas']["BuiltinToolBrowserPagesGetOutput"];
  "browser.pages.list": components['schemas']["BuiltinToolBrowserPagesListOutput"];
  "browser.pages.open": components['schemas']["BuiltinToolBrowserPagesOpenOutput"];
  "captcha.solve": components['schemas']["BuiltinToolCaptchaSolveOutput"];
  "files.list": components['schemas']["BuiltinToolFilesListOutput"];
  "files.read_text": components['schemas']["BuiltinToolFilesReadTextOutput"];
  "run.files.export": components['schemas']["BuiltinToolRunFilesExportOutput"];
  "runtime.files.collect": components['schemas']["BuiltinToolRuntimeFilesCollectOutput"];
  "runtime.files.list": components['schemas']["BuiltinToolRuntimeFilesListOutput"];
  "runtime.files.stage": components['schemas']["BuiltinToolRuntimeFilesStageOutput"];
  "stagehand.act": components['schemas']["BuiltinToolStagehandActOutput"];
  "stagehand.extract": components['schemas']["BuiltinToolStagehandExtractOutput"];
  "stagehand.observe": components['schemas']["BuiltinToolStagehandObserveOutput"];
  "vault.secrets.delete": components['schemas']["BuiltinToolVaultSecretsDeleteOutput"];
  "vault.secrets.get": components['schemas']["BuiltinToolVaultSecretsGetOutput"];
  "vault.secrets.list": components['schemas']["BuiltinToolVaultSecretsListOutput"];
  "vault.secrets.set": components['schemas']["BuiltinToolVaultSecretsSetOutput"];
  "vault.secrets.update": components['schemas']["BuiltinToolVaultSecretsUpdateOutput"];
  "vault.secrets.value": components['schemas']["BuiltinToolVaultSecretsValueOutput"];
  "vault.totp.generate": components['schemas']["BuiltinToolVaultTotpGenerateOutput"];
}

export type BuiltinToolName = keyof BuiltinToolInputMap;
export type SyncBuiltinToolName = keyof BuiltinToolOutputMap;
export type AsyncBuiltinToolName = "browser.pages.activate" | "browser.pages.close" | "browser.pages.open" | "captcha.solve" | "human.request" | "run.files.export" | "runtime.files.collect" | "runtime.files.stage" | "stagehand.act" | "stagehand.extract" | "stagehand.observe";

