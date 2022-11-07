export type AbiActionDto = {
  name: string; // The name of the action as defined in the contract
  type: string; // The name of the implicit struct as described in the ABI
  ricardian_contract: string; // An optional ricardian clause to associate to this action describing its intended functionality.
};

export type AbiDto = {
  version: string;
  types: AbiTypeDto[];
  structs: AbiStructDto[];
  tables: AbiTableDto[];
  actions: AbiActionDto[];
  ricardian_clauses: RicardianClauseDto[];
  abi_extensions: AbiExtensionDto[];
  error_messages: AbiErrorMessageDto[];
  variants?: AbiVariantDto[];
};

export type AbiErrorMessageDto = {
  error_code: number;
  error_msg: string;
};

export type AbiVariantDto = {
  name: string;
  types: string[];
};

export type RicardianClauseDto = {
  id: string;
  body: string;
};

export type AbiExtensionDto = {
  tag: number;
  value: string;
};

export type AbiTypeDto = {
  new_type_name: string;
  type: string;
};

export type AbiStructFieldDto = {
  name: string;
  type: string;
};

export type AbiStructDto = {
  name: string;
  base: string;
  fields: AbiStructFieldDto[];
};

export type CreateStructDto = {
  name: 'create';
  base: '';
  fields: [IssuerFieldDto, MaximumSupplyFieldDto];
};

export type IssueStructDto = {
  name: 'issue';
  base: '';
  fields: [ToFieldDto, QuantityFieldDto, MemoFieldDto];
};

export type RetireStructDto = {
  name: 'retire';
  base: '';
  fields: [QuantityFieldDto, MemoFieldDto];
};

export type TransfereStructDto = {
  name: 'transfer';
  base: '';
  fields: [FromFieldDto, ToFieldDto, QuantityFieldDto, MemoFieldDto];
};

export type CloseStructDto = {
  name: 'close';
  base: '';
  fields: [SymbolFieldDto, OwnerFieldDto];
};

export type FieldDto = {
  name: string;
  type: string;
};

export type OwnerFieldDto = {
  name: 'owner';
  type: 'name';
};

export type SymbolFieldDto = {
  name: 'symbol';
  type: 'symbol';
};

export type MemoFieldDto = {
  name: 'memo';
  type: 'string';
};

export type QuantityFieldDto = {
  name: 'quantity';
  type: 'asset';
};

export type ToFieldDto = {
  name: 'to';
  type: 'name';
};

export type FromFieldDto = {
  name: 'from';
  type: 'name';
};

export type IssuerFieldDto = {
  name: 'issuer';
  type: 'name';
};

export type MaximumSupplyFieldDto = {
  name: 'maximum_supply';
  type: 'asset';
};

export type AbiTableDto = {
  name: string; // 'accounts' | 'stats'
  type: string; // 'account' | 'currency_stats' ... Corresponds to previously defined struct
  index_type: string; // 'i64'
  key_names: string[];
  key_types: string[];
};
