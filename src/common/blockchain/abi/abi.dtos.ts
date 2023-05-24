export type AbiActionJson = {
  name: string; // The name of the action as defined in the contract
  type: string; // The name of the implicit struct as described in the ABI
  ricardian_contract: string; // An optional ricardian clause to associate to this action describing its intended functionality.
};

export type AbiJson = {
  version: string;
  types: AbiTypeJson[];
  structs: AbiStructJson[];
  tables: AbiTableJson[];
  actions: AbiActionJson[];
  ricardian_clauses: RicardianClauseJson[];
  abi_extensions: AbiExtensionJson[];
  error_messages: AbiErrorMessageJson[];
  variants?: AbiVariantJson[];
};

export type AbiErrorMessageJson = {
  error_code: number;
  error_msg: string;
};

export type AbiVariantJson = {
  name: string;
  types: string[];
};

export type RicardianClauseJson = {
  id: string;
  body: string;
};

export type AbiExtensionJson = {
  tag: number;
  value: string;
};

export type AbiTypeJson = {
  new_type_name: string;
  type: string;
};

export type AbiStructFieldJson = {
  name: string;
  type: string;
};

export type AbiStructJson = {
  name: string;
  base: string;
  fields: AbiStructFieldJson[];
};

export type CreateStructJson = {
  name: 'create';
  base: '';
  fields: [IssuerFieldJson, MaximumSupplyFieldJson];
};

export type IssueStructJson = {
  name: 'issue';
  base: '';
  fields: [ToFieldJson, QuantityFieldJson, MemoFieldJson];
};

export type RetireStructJson = {
  name: 'retire';
  base: '';
  fields: [QuantityFieldJson, MemoFieldJson];
};

export type TransfereStructJson = {
  name: 'transfer';
  base: '';
  fields: [FromFieldJson, ToFieldJson, QuantityFieldJson, MemoFieldJson];
};

export type CloseStructJson = {
  name: 'close';
  base: '';
  fields: [SymbolFieldJson, OwnerFieldJson];
};

export type FieldJson = {
  name: string;
  type: string;
};

export type OwnerFieldJson = {
  name: 'owner';
  type: 'name';
};

export type SymbolFieldJson = {
  name: 'symbol';
  type: 'symbol';
};

export type MemoFieldJson = {
  name: 'memo';
  type: 'string';
};

export type QuantityFieldJson = {
  name: 'quantity';
  type: 'asset';
};

export type ToFieldJson = {
  name: 'to';
  type: 'name';
};

export type FromFieldJson = {
  name: 'from';
  type: 'name';
};

export type IssuerFieldJson = {
  name: 'issuer';
  type: 'name';
};

export type MaximumSupplyFieldJson = {
  name: 'maximum_supply';
  type: 'asset';
};

export type AbiTableJson = {
  name: string; // 'accounts' | 'stats'
  type: string; // 'account' | 'currency_stats' ... Corresponds to previously defined struct
  index_type: string; // 'i64'
  key_names: string[];
  key_types: string[];
};
