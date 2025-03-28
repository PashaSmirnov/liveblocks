import type { LiveList } from "../crdts/LiveList";
import type { LiveMap } from "../crdts/LiveMap";
import type { LiveObject } from "../crdts/LiveObject";
import type { LiveRegister } from "../crdts/LiveRegister";
import type { Json } from "../lib/Json";
import type { LiveAsyncRegister } from "./LiveAsyncRegister";

export type LiveStructure =
  | LiveObject<LsonObject>
  | LiveList<Lson>
  | LiveMap<string, Lson>
  | LiveAsyncRegister<LiveObject<LsonObject>>;

/**
 * Think of Lson as a sibling of the Json data tree, except that the nested
 * data structure can contain a mix of Json values and LiveStructure instances.
 */
export type Lson = Json | LiveStructure;

/**
 * LiveNode is the internal tree for managing Live data structures. The key
 * difference with Lson is that all the Json values get represented in
 * a LiveRegister node.
 */
export type LiveNode =
  | LiveStructure

  // LiveRegister is for private/internal use only
  | LiveRegister<Json>;

/**
 * A mapping of keys to Lson values. A Lson value is any valid JSON
 * value or a Live storage data structure (LiveMap, LiveList, etc.)
 */
export type LsonObject = { [key: string]: Lson | undefined };

/**
 * Helper type to convert any valid Lson type to the equivalent Json type.
 *
 * Examples:
 *
 *   ToJson<42>                         // 42
 *   ToJson<'hi'>                       // 'hi'
 *   ToJson<number>                     // number
 *   ToJson<string>                     // string
 *   ToJson<string | LiveList<number>>  // string | number[]
 *   ToJson<LiveMap<string, LiveList<number>>>
 *                                      // { [key: string]: number[] }
 *   ToJson<LiveObject<{ a: number, b: LiveList<string>, c?: number }>>
 *                                      // { a: null, b: string[], c?: number }
 *
 */
// prettier-ignore
export type ToJson<T extends Lson | LsonObject> =
  // Any Json value already is a legal Json value
  T extends Json ? T :

  // Any LsonObject recursively becomes a JsonObject
  T extends LsonObject ?
    { [K in keyof T]: ToJson<Exclude<T[K], undefined>>
                        | (undefined extends T[K] ? undefined : never) } :

  // A LiveList serializes to an equivalent JSON array
  T extends LiveList<infer I> ? ToJson<I>[] :

  // A LiveObject serializes to an equivalent JSON object
  T extends LiveObject<infer O> ? ToJson<O> :

  // A LiveMap serializes to a JSON object with string-V pairs
  T extends LiveMap<infer KS, infer V> ? { [K in KS]: ToJson<V> } :

  // A LiveMap serializes to a JSON object with string-V pairs
  T extends LiveAsyncRegister<infer V> ? { asyncId: string, asyncType: string, data: ToJson<V> | null } :

  // Otherwise, this is not possible
  never;
