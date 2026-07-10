import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

type PropertyOfUnion<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : never
  : never;

export type V1ProxyProtocol = NonNullable<
  OpenApiSchemas['ProxyManagedRotatingCreateRequest']['protocol']
>;
export type V1ProxyDnsResolution = NonNullable<
  OpenApiSchemas['ProxyManagedRotatingCreateRequest']['dnsResolution']
>;
export type V1ProxyType = OpenApiSchemas['Proxy']['type'];
export type V1ManagedRotatingPreference = NonNullable<
  PropertyOfUnion<OpenApiSchemas['ProxyManagedRotatingCreateRequest'], 'preference'>
>;
export type V1ManagedRotatingRotation = NonNullable<
  OpenApiSchemas['ProxyManagedRotatingCreateRequest']['rotation']
>;
export type V1ManagedRotatingDevice = NonNullable<
  PropertyOfUnion<OpenApiSchemas['ProxyManagedRotatingCreateRequest'], 'device'>
>;

export interface V1ProxyBase {
  id: string;
  name: string;
  subaccountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type V1ManagedRotatingProxyConfig = Omit<
  OpenApiSchemas['ProxyManagedRotatingCreateRequest'],
  'name' | 'type'
>;

export type V1Proxy = OpenApiSchemas['Proxy'];

export type V1ProxyCreateRequest = OpenApiSchemas['ProxyCreateRequest'];

export type V1ProxyUpdateRequest = OpenApiSchemas['ProxyUpdateRequest'];

export type V1ProxyListQuery = OpenApiQuery<'proxies.list'>;

export type V1ProxyDeleteResponse = OpenApiSchemas['ProxyDeleteResponse'];

export type V1ProxyTestResponse = OpenApiSchemas['ProxyTestResponse'];

export type V1ProxyPool = OpenApiSchemas['ProxyPool'];

export type V1ProxyPoolListQuery = OpenApiQuery<'proxies.pools.list'>;
