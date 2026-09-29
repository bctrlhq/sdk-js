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
  "browser.setInputFiles": components['schemas']["BuiltinToolBrowserSetInputFilesInput"];
  "captcha.solve": components['schemas']["BuiltinToolCaptchaSolveInput"];
  "captcha.status": components['schemas']["BuiltinToolCaptchaStatusInput"];
  "captcha.wait": components['schemas']["BuiltinToolCaptchaWaitInput"];
  "code.execute": components['schemas']["BuiltinToolCodeExecuteInput"];
  "files.list": components['schemas']["BuiltinToolFilesListInput"];
  "files.read_text": components['schemas']["BuiltinToolFilesReadTextInput"];
  "human.request": components['schemas']["BuiltinToolHumanRequestInput"];
  "run.files.add": components['schemas']["BuiltinToolRunFilesAddInput"];
  "run.files.collect": components['schemas']["BuiltinToolRunFilesCollectInput"];
  "run.files.export": components['schemas']["BuiltinToolRunFilesExportInput"];
  "run.files.list": components['schemas']["BuiltinToolRunFilesListInput"];
  "runtime.files.list": components['schemas']["BuiltinToolRuntimeFilesListInput"];
  "secrets.list": components['schemas']["BuiltinToolSecretsListInput"];
  "stagehand.act": components['schemas']["BuiltinToolStagehandActInput"];
  "stagehand.extract": components['schemas']["BuiltinToolStagehandExtractInput"];
  "stagehand.observe": components['schemas']["BuiltinToolStagehandObserveInput"];
}

export interface BuiltinToolOutputMap {
  "browser.pages.activate": components['schemas']["BuiltinToolBrowserPagesActivateOutput"];
  "browser.pages.close": components['schemas']["BuiltinToolBrowserPagesCloseOutput"];
  "browser.pages.get": components['schemas']["BuiltinToolBrowserPagesGetOutput"];
  "browser.pages.list": components['schemas']["BuiltinToolBrowserPagesListOutput"];
  "browser.pages.open": components['schemas']["BuiltinToolBrowserPagesOpenOutput"];
  "browser.setInputFiles": components['schemas']["BuiltinToolBrowserSetInputFilesOutput"];
  "captcha.solve": components['schemas']["BuiltinToolCaptchaSolveOutput"];
  "captcha.status": components['schemas']["BuiltinToolCaptchaStatusOutput"];
  "captcha.wait": components['schemas']["BuiltinToolCaptchaWaitOutput"];
  "files.list": components['schemas']["BuiltinToolFilesListOutput"];
  "files.read_text": components['schemas']["BuiltinToolFilesReadTextOutput"];
  "run.files.add": components['schemas']["BuiltinToolRunFilesAddOutput"];
  "run.files.collect": components['schemas']["BuiltinToolRunFilesCollectOutput"];
  "run.files.export": components['schemas']["BuiltinToolRunFilesExportOutput"];
  "run.files.list": components['schemas']["BuiltinToolRunFilesListOutput"];
  "runtime.files.list": components['schemas']["BuiltinToolRuntimeFilesListOutput"];
  "secrets.list": components['schemas']["BuiltinToolSecretsListOutput"];
  "stagehand.act": components['schemas']["BuiltinToolStagehandActOutput"];
  "stagehand.extract": components['schemas']["BuiltinToolStagehandExtractOutput"];
  "stagehand.observe": components['schemas']["BuiltinToolStagehandObserveOutput"];
}

export type BuiltinToolName = keyof BuiltinToolInputMap;
export type SyncBuiltinToolName = keyof BuiltinToolOutputMap;
export type AsyncBuiltinToolName = "browser.pages.activate" | "browser.pages.close" | "browser.pages.open" | "browser.setInputFiles" | "captcha.solve" | "code.execute" | "human.request" | "run.files.add" | "run.files.collect" | "run.files.export" | "stagehand.act" | "stagehand.extract" | "stagehand.observe";

