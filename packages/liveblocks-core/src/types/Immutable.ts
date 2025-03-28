/**
 * Represents an indefinitely deep arbitrary immutable data
 * structure, as returned by the .toImmutable().
 */

export type Immutable =
  | Scalar
  | ImmutableList
  | ImmutableObject
  | ImmutableMap
  | ImmutableAsyncRegister;
type Scalar = string | number | boolean | null;
type ImmutableList = readonly Immutable[];
type ImmutableObject = { readonly [key: string]: Immutable | undefined };
type ImmutableMap = ReadonlyMap<string, Immutable>;
type ImmutableAsyncRegister = { readonly data: Immutable | null };
