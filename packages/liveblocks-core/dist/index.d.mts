/**
 * Throws an error if multiple copies of a Liveblocks package are being loaded
 * at runtime. This likely indicates a packaging issue with the project.
 */
declare function detectDupes(pkgName: string, pkgVersion: string | false, // false if not built yet
pkgFormat: string | false): void;

declare type CustomAuthenticationResult = {
    token: string;
    error?: never;
} | {
    token?: never;
    error: "forbidden";
    reason: string;
} | {
    token?: never;
    error: string;
    reason: string;
};

/**
 * Represents an indefinitely deep arbitrary JSON data structure. There are
 * four types that make up the Json family:
 *
 * - Json         any legal JSON value
 * - JsonScalar   any legal JSON leaf value (no lists or objects)
 * - JsonArray    a JSON value whose outer type is an array
 * - JsonObject   a JSON value whose outer type is an object
 *
 */
declare type Json = JsonScalar | JsonArray | JsonObject;
declare type JsonScalar = string | number | boolean | null;
declare type JsonArray = Json[];
/**
 * Any valid JSON object.
 */
declare type JsonObject = {
    [key: string]: Json | undefined;
};
declare function isJsonScalar(data: Json): data is JsonScalar;
declare function isJsonArray(data: Json): data is JsonArray;
declare function isJsonObject(data: Json): data is JsonObject;

/**
 * Represents some constraints for user info. Basically read this as: "any JSON
 * object is fine, but _if_ it has a name field, it _must_ be a string."
 * (Ditto for avatar.)
 */
declare type IUserInfo = {
    [key: string]: Json | undefined;
    name?: string;
    avatar?: string;
};
/**
 * This type is used by clients to define the metadata for a user.
 */
declare type BaseUserMeta = {
    /**
     * The id of the user that has been set in the authentication endpoint.
     * Useful to get additional information about the connected user.
     */
    id?: string;
    /**
     * Additional user information that has been set in the authentication endpoint.
     */
    info?: IUserInfo;
};

declare type Callback<T> = (event: T) => void;
declare type UnsubscribeCallback = () => void;
declare type Observable<T> = {
    /**
     * Register a callback function to be called whenever the event source emits
     * an event.
     */
    subscribe(callback: Callback<T>): UnsubscribeCallback;
    /**
     * Register a one-time callback function to be called whenever the event
     * source emits an event. After the event fires, the callback is
     * auto-unsubscribed.
     */
    subscribeOnce(callback: Callback<T>): UnsubscribeCallback;
    /**
     * Returns a promise that will resolve when an event is emitted by this
     * event source. Optionally, specify a predicate that has to match. The first
     * event matching that predicate will then resolve the promise.
     */
    waitUntil(predicate?: (event: T) => boolean): Promise<T>;
};
declare type EventSource<T> = Observable<T> & {
    /**
     * Notify all subscribers about the event.
     */
    notify(event: T): void;
    /**
     * Clear all registered event listeners. None of the registered functions
     * will ever get called again. Be careful when using this API, because the
     * subscribers may not have any idea they won't be notified anymore.
     */
    clear(): void;
    /**
     * Returns the number of active subscribers.
     */
    count(): number;
    /**
     * Pauses event delivery until unpaused. Any .notify() calls made while
     * paused will get buffered into memory and emitted later.
     */
    pause(): void;
    /**
     * Emits all in-memory buffered events, and unpauses. Any .notify() calls
     * made after this will be synchronously delivered again.
     */
    unpause(): void;
    /**
     * Observable instance, which can be used to subscribe to this event source
     * in a readonly fashion. Safe to publicly expose.
     */
    observable: Observable<T>;
};
/**
 * makeEventSource allows you to generate a subscribe/notify pair of functions
 * to make subscribing easy and to get notified about events.
 *
 * The events are anonymous, so you can use it to define events, like so:
 *
 *   const event1 = makeEventSource();
 *   const event2 = makeEventSource();
 *
 *   event1.subscribe(foo);
 *   event1.subscribe(bar);
 *   event2.subscribe(qux);
 *
 *   // Unsubscription is pretty standard
 *   const unsub = event2.subscribe(foo);
 *   unsub();
 *
 *   event1.notify();  // Now foo and bar will get called
 *   event2.notify();  // Now qux will get called (but foo will not, since it's unsubscribed)
 *
 */
declare function makeEventSource<T>(): EventSource<T>;

interface IWebSocketEvent {
    type: string;
}
interface IWebSocketCloseEvent extends IWebSocketEvent {
    readonly code: WebsocketCloseCodes;
    readonly wasClean: boolean;
    readonly reason: string;
}
interface IWebSocketMessageEvent extends IWebSocketEvent {
    readonly data: string | Buffer | ArrayBuffer | readonly Buffer[];
}
interface IWebSocketInstance {
    readonly CONNECTING: number;
    readonly OPEN: number;
    readonly CLOSING: number;
    readonly CLOSED: number;
    readonly readyState: number;
    addEventListener(type: "close", listener: (this: IWebSocketInstance, ev: IWebSocketCloseEvent) => unknown): void;
    addEventListener(type: "message", listener: (this: IWebSocketInstance, ev: IWebSocketMessageEvent) => unknown): void;
    addEventListener(type: "open" | "error", listener: (this: IWebSocketInstance, ev: IWebSocketEvent) => unknown): void;
    removeEventListener(type: "close", listener: (this: IWebSocketInstance, ev: IWebSocketCloseEvent) => unknown): void;
    removeEventListener(type: "message", listener: (this: IWebSocketInstance, ev: IWebSocketMessageEvent) => unknown): void;
    removeEventListener(type: "open" | "error", listener: (this: IWebSocketInstance, ev: IWebSocketEvent) => unknown): void;
    close(): void;
    send(data: string): void;
}
/**
 * Either the browser-based WebSocket API or Node.js' WebSocket API (from the
 * 'ws' package).
 *
 * This type defines the minimal WebSocket API that Liveblocks needs from
 * a WebSocket implementation, and is a minimal subset of the browser-based
 * WebSocket APIs and Node.js' WebSocket API so that both implementations are
 * assignable to this type.
 */
interface IWebSocket {
    new (address: string): IWebSocketInstance;
}
/**
 * The following ranges will be respected by the client:
 *
 *   10xx: client will reauthorize (just like 41xx)
 *   40xx: client will disconnect
 *   41xx: client will reauthorize
 *   42xx: client will retry without reauthorizing (currently not used)
 *
 */
declare enum WebsocketCloseCodes {
    /** Normal close of connection, the connection fulfilled its purpose. */
    CLOSE_NORMAL = 1000,
    /** Unexpected error happened with the network/infra level. In spirit akin to HTTP 503 */
    CLOSE_ABNORMAL = 1006,
    /** Unexpected error happened. In spirit akin to HTTP 500 */
    UNEXPECTED_CONDITION = 1011,
    /** Please back off for now, but try again in a few moments */
    TRY_AGAIN_LATER = 1013,
    /** Message wasn't understood, disconnect */
    INVALID_MESSAGE_FORMAT = 4000,
    /** Server refused to allow connection. Re-authorizing won't help. Disconnect. In spirit akin to HTTP 403 */
    NOT_ALLOWED = 4001,
    /** Unused */
    MAX_NUMBER_OF_MESSAGES_PER_SECONDS = 4002,
    /** Unused */
    MAX_NUMBER_OF_CONCURRENT_CONNECTIONS = 4003,
    /** Unused */
    MAX_NUMBER_OF_MESSAGES_PER_DAY_PER_APP = 4004,
    /** Room is full, disconnect */
    MAX_NUMBER_OF_CONCURRENT_CONNECTIONS_PER_ROOM = 4005,
    /** The room's ID was updated, disconnect */
    ROOM_ID_UPDATED = 4006,
    /** The server kicked the connection from the room. */
    KICKED = 4100,
    /** The auth token is expired, reauthorize to get a fresh one. In spirit akin to HTTP 401 */
    TOKEN_EXPIRED = 4109,
    /** Disconnect immediately */
    CLOSE_WITHOUT_RETRY = 4999
}

/**
 * Returns a human-readable status indicating the current connection status of
 * a Room, as returned by `room.getStatus()`. Can be used to implement
 * a connection status badge.
 */
declare type Status = "initial" | "connecting" | "connected" | "reconnecting" | "disconnected";
/**
 * Used to report about app-level reconnection issues.
 *
 * Normal (quick) reconnects won't be reported as a "lost connection". Instead,
 * the application will only get an event if the reconnection attempts by the
 * client are taking (much) longer than usual. Definitely a situation you want
 * to inform your users about, for example, by throwing a toast message on
 * screen, or show a "trying to reconnect" banner.
 */
declare type LostConnectionEvent = "lost" | "restored" | "failed";
/**
 * Arbitrary record that will be used as the authentication "authValue". It's the
 * value that is returned by calling the authentication delegate, and will get
 * passed to the connection factory delegate. This value will be remembered by
 * the connection manager, but its value will not be interpreted, so it can be
 * any value (except null).
 */
declare type BaseAuthResult = NonNullable<Json>;
declare class LiveblocksError extends Error {
    code: number;
}
declare type Delegates<T extends BaseAuthResult> = {
    authenticate: () => Promise<T>;
    createSocket: (authValue: T) => IWebSocketInstance;
    canZombie: () => boolean;
};

declare enum OpCode {
    INIT = 0,
    SET_PARENT_KEY = 1,
    CREATE_LIST = 2,
    UPDATE_OBJECT = 3,
    CREATE_OBJECT = 4,
    DELETE_CRDT = 5,
    DELETE_OBJECT_KEY = 6,
    CREATE_MAP = 7,
    CREATE_REGISTER = 8,
    CREATE_ASYNC_REGISTER = 524
}
/**
 * These operations are the payload for {@link UpdateStorageServerMsg} messages
 * only.
 */
declare type Op = AckOp | CreateOp | UpdateObjectOp | DeleteCrdtOp | SetParentKeyOp | DeleteObjectKeyOp;
declare type CreateOp = CreateObjectOp | CreateRegisterOp | CreateAsyncRegisterOp | CreateMapOp | CreateListOp;
declare type UpdateObjectOp = {
    readonly opId?: string;
    readonly id: string;
    readonly type: OpCode.UPDATE_OBJECT;
    readonly data: Partial<JsonObject>;
};
declare type CreateObjectOp = {
    readonly opId?: string;
    readonly id: string;
    readonly intent?: "set";
    readonly deletedId?: string;
    readonly type: OpCode.CREATE_OBJECT;
    readonly parentId: string;
    readonly parentKey: string;
    readonly data: JsonObject;
};
declare type CreateListOp = {
    readonly opId?: string;
    readonly id: string;
    readonly intent?: "set";
    readonly deletedId?: string;
    readonly type: OpCode.CREATE_LIST;
    readonly parentId: string;
    readonly parentKey: string;
};
declare type CreateMapOp = {
    readonly opId?: string;
    readonly id: string;
    readonly intent?: "set";
    readonly deletedId?: string;
    readonly type: OpCode.CREATE_MAP;
    readonly parentId: string;
    readonly parentKey: string;
};
declare type CreateRegisterOp = {
    readonly opId?: string;
    readonly id: string;
    readonly intent?: "set";
    readonly deletedId?: string;
    readonly type: OpCode.CREATE_REGISTER;
    readonly parentId: string;
    readonly parentKey: string;
    readonly data: Json;
};
declare type CreateAsyncRegisterOp = {
    readonly opId?: string;
    readonly id: string;
    readonly intent?: "set";
    readonly deletedId?: string;
    readonly type: OpCode.CREATE_ASYNC_REGISTER;
    readonly parentId: string;
    readonly parentKey: string;
    readonly asyncType?: string;
    readonly asyncId?: string;
};
declare type DeleteCrdtOp = {
    readonly opId?: string;
    readonly id: string;
    readonly type: OpCode.DELETE_CRDT;
};
declare type AckOp = {
    readonly type: OpCode.DELETE_CRDT;
    readonly id: "ACK";
    readonly opId: string;
};
/**
 * Create an Op that can be used as an acknowledgement for the given opId, to
 * send back to the originating client in cases where the server decided to
 * ignore the Op and not forward it.
 *
 * Why?
 * It's important for the client to receive an acknowledgement for this, so
 * that it can correctly update its own unacknowledged Ops administration.
 * Otherwise it could get in "synchronizing" state indefinitely.
 *
 * CLEVER HACK
 * Introducing a new Op type for this would not be backward-compatible as
 * receiving such Op would crash old clients :(
 * So the clever backward-compatible hack pulled here is that we codify the
 * acknowledgement as a "deletion Op" for the non-existing node id "ACK". In
 * old clients such Op is accepted, but will effectively be a no-op as that
 * node does not exist, but as a side-effect the Op will get acknowledged.
 */
declare function ackOp(opId: string): AckOp;
declare type SetParentKeyOp = {
    readonly opId?: string;
    readonly id: string;
    readonly type: OpCode.SET_PARENT_KEY;
    readonly parentKey: string;
};
declare type DeleteObjectKeyOp = {
    readonly opId?: string;
    readonly id: string;
    readonly type: OpCode.DELETE_OBJECT_KEY;
    readonly key: string;
};

/**
 * Represents an indefinitely deep arbitrary immutable data
 * structure, as returned by the .toImmutable().
 */
declare type Immutable = Scalar | ImmutableList | ImmutableObject | ImmutableMap | ImmutableAsyncRegister;
declare type Scalar = string | number | boolean | null;
declare type ImmutableList = readonly Immutable[];
declare type ImmutableObject = {
    readonly [key: string]: Immutable | undefined;
};
declare type ImmutableMap = ReadonlyMap<string, Immutable>;
declare type ImmutableAsyncRegister = {
    readonly data: Immutable | null;
};

declare type UpdateDelta = {
    type: "update";
} | {
    type: "delete";
};

/**
 * "Plain LSON" is a JSON-based format that's used when serializing Live structures
 * to send them over HTTP (e.g. in the API endpoint to let users upload their initial
 * Room storage, in the API endpoint to fetch a Room's storage, ...).
 *
 * In the client, you would typically create LSON values using:
 *
 *    new LiveObject({ x: 0, y: 0 })
 *
 * But over HTTP, this has to be serialized somehow. The "Plain LSON" format
 * is what's used in the POST /init-storage-new endpoint, to allow users to
 * control which parts of their data structure should be considered "Live"
 * objects, and which parts are "normal" objects.
 *
 * So if they have a structure like:
 *
 *    { x: 0, y: 0 }
 *
 * And want to make it a Live object, they can serialize it by wrapping it in
 * a special "annotation":
 *
 *    {
 *      "liveblocksType": "LiveObject",
 *      "data": { x: 0, y: 0 },
 *    }
 *
 * This "Plain LSON" data format defines exactly those wrappings.
 *
 * To summarize:
 *
 *   LSON value            |  Plain LSON equivalent
 *   ----------------------+----------------------------------------------
 *   42                    |  42
 *   [1, 2, 3]             |  [1, 2, 3]
 *   { x: 0, y: 0 }        |  { x: 0, y: 0 }
 *   ----------------------+----------------------------------------------
 *   new LiveList(...)     |  { liveblocksType: "LiveList",   data: ... }
 *   new LiveMap(...)      |  { liveblocksType: "LiveMap",    data: ... }
 *   new LiveObject(...)   |  { liveblocksType: "LiveObject", data: ... }
 *
 */

declare type PlainLsonFields = Record<string, PlainLson>;
declare type PlainLsonObject = {
    liveblocksType: "LiveObject";
    data: PlainLsonFields;
};
declare type PlainLsonMap = {
    liveblocksType: "LiveMap";
    data: PlainLsonFields;
};
declare type PlainLsonList = {
    liveblocksType: "LiveList";
    data: PlainLson[];
};
declare type PlainLsonAsyncRegister = {
    liveblocksType: "LiveAsyncRegister";
    data: {
        asyncType?: string;
        asyncId?: string;
    };
};
declare type PlainLson = PlainLsonObject | PlainLsonMap | PlainLsonList | PlainLsonAsyncRegister | Json;

declare type LiveAsyncRegisterDelta = {
    type: "loaded";
} | {
    type: "set";
} | {
    type: "clear";
};
/**
 * A LiveList notification that is sent in-client to any subscribers whenever
 * one or more of the items inside the LiveList instance have changed.
 */
declare type LiveAsyncRegisterUpdates<TItem extends LiveObject<LsonObject>> = {
    type: "LiveAsyncRegister";
    node: LiveAsyncRegister<TItem>;
    updates: LiveAsyncRegisterDelta[];
};
/**
 * The LiveObject class is similar to a JavaScript object that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
declare class LiveAsyncRegister<TValue extends LiveObject<LsonObject>> extends AbstractCrdt {
    #private;
    asyncType?: string;
    asyncId?: string;
    constructor({ asyncType, asyncId, }: {
        asyncType?: string;
        asyncId?: string;
    });
    get(): TValue | null;
    toImmutable(): ToImmutable<LiveAsyncRegister<TValue>>;
    clone(): LiveAsyncRegister<TValue>;
}

/**
 * Helper type to convert any valid Lson type to the equivalent Json type.
 *
 * Examples:
 *
 *   ToImmutable<42>                         // 42
 *   ToImmutable<'hi'>                       // 'hi'
 *   ToImmutable<number>                     // number
 *   ToImmutable<string>                     // string
 *   ToImmutable<string | LiveList<number>>  // string | readonly number[]
 *   ToImmutable<LiveMap<string, LiveList<number>>>
 *                                           // ReadonlyMap<string, readonly number[]>
 *   ToImmutable<LiveObject<{ a: number, b: LiveList<string>, c?: number }>>
 *                                           // { readonly a: null, readonly b: readonly string[], readonly c?: number }
 *
 */
declare type ToImmutable<L extends Lson | LsonObject> = L extends LiveList<infer I> ? readonly ToImmutable<I>[] : L extends LiveObject<infer O> ? ToImmutable<O> : L extends LiveMap<infer K, infer V> ? ReadonlyMap<K, ToImmutable<V>> : L extends LiveAsyncRegister<infer I> ? {
    data: ToImmutable<I> | null;
} : L extends LsonObject ? {
    readonly [K in keyof L]: ToImmutable<Exclude<L[K], undefined>> | (undefined extends L[K] ? undefined : never);
} : L extends Json ? L : never;
/**
 * Returns PlainLson for a given Json or LiveStructure, suitable for calling the storage init api
 */
declare function toPlainLson(lson: Lson): PlainLson;

/**
 * A LiveMap notification that is sent in-client to any subscribers whenever
 * one or more of the values inside the LiveMap instance have changed.
 */
declare type LiveMapUpdates<TKey extends string, TValue extends Lson> = {
    type: "LiveMap";
    node: LiveMap<TKey, TValue>;
    updates: {
        [key: string]: UpdateDelta;
    };
};
/**
 * The LiveMap class is similar to a JavaScript Map that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
declare class LiveMap<TKey extends string, TValue extends Lson> extends AbstractCrdt {
    constructor(entries?: readonly (readonly [TKey, TValue])[] | undefined);
    /**
     * Returns a specified element from the LiveMap.
     * @param key The key of the element to return.
     * @returns The element associated with the specified key, or undefined if the key can't be found in the LiveMap.
     */
    get(key: TKey): TValue | undefined;
    /**
     * Adds or updates an element with a specified key and a value.
     * @param key The key of the element to add. Should be a string.
     * @param value The value of the element to add. Should be serializable to JSON.
     */
    set(key: TKey, value: TValue): void;
    /**
     * Returns the number of elements in the LiveMap.
     */
    get size(): number;
    /**
     * Returns a boolean indicating whether an element with the specified key exists or not.
     * @param key The key of the element to test for presence.
     */
    has(key: TKey): boolean;
    /**
     * Removes the specified element by key.
     * @param key The key of the element to remove.
     * @returns true if an element existed and has been removed, or false if the element does not exist.
     */
    delete(key: TKey): boolean;
    /**
     * Returns a new Iterator object that contains the [key, value] pairs for each element.
     */
    entries(): IterableIterator<[TKey, TValue]>;
    /**
     * Same function object as the initial value of the entries method.
     */
    [Symbol.iterator](): IterableIterator<[TKey, TValue]>;
    /**
     * Returns a new Iterator object that contains the keys for each element.
     */
    keys(): IterableIterator<TKey>;
    /**
     * Returns a new Iterator object that contains the values for each element.
     */
    values(): IterableIterator<TValue>;
    /**
     * Executes a provided function once per each key/value pair in the Map object, in insertion order.
     * @param callback Function to execute for each entry in the map.
     */
    forEach(callback: (value: TValue, key: TKey, map: LiveMap<TKey, TValue>) => void): void;
    toImmutable(): ReadonlyMap<TKey, ToImmutable<TValue>>;
    clone(): LiveMap<TKey, TValue>;
}

declare type StorageCallback = (updates: StorageUpdate[]) => void;
declare type LiveMapUpdate = LiveMapUpdates<string, Lson>;
declare type LiveObjectUpdate = LiveObjectUpdates<LsonObject>;
declare type LiveListUpdate = LiveListUpdates<Lson>;
declare type LiveAsyncRegisterUpdate = LiveAsyncRegisterUpdates<LiveObject<LsonObject>>;
/**
 * The payload of notifications sent (in-client) when LiveStructures change.
 * Messages of this kind are not originating from the network, but are 100%
 * in-client.
 */
declare type StorageUpdate = LiveMapUpdate | LiveObjectUpdate | LiveListUpdate | LiveAsyncRegisterUpdate;

declare abstract class AbstractCrdt {
    get roomId(): string | null;
    /**
     * Return an immutable snapshot of this Live node and its children.
     */
    toImmutable(): Immutable;
    /**
     * Returns a deep clone of the current LiveStructure, suitable for insertion
     * in the tree elsewhere.
     */
    abstract clone(): Lson;
}

declare type LiveListUpdateDelta = {
    type: "insert";
    index: number;
    item: Lson;
} | {
    type: "delete";
    index: number;
} | {
    type: "move";
    index: number;
    previousIndex: number;
    item: Lson;
} | {
    type: "set";
    index: number;
    item: Lson;
};
/**
 * A LiveList notification that is sent in-client to any subscribers whenever
 * one or more of the items inside the LiveList instance have changed.
 */
declare type LiveListUpdates<TItem extends Lson> = {
    type: "LiveList";
    node: LiveList<TItem>;
    updates: LiveListUpdateDelta[];
};
/**
 * The LiveList class represents an ordered collection of items that is synchronized across clients.
 */
declare class LiveList<TItem extends Lson> extends AbstractCrdt {
    constructor(items: TItem[]);
    /**
     * Returns the number of elements.
     */
    get length(): number;
    /**
     * Adds one element to the end of the LiveList.
     * @param element The element to add to the end of the LiveList.
     */
    push(element: TItem): void;
    /**
     * Inserts one element at a specified index.
     * @param element The element to insert.
     * @param index The index at which you want to insert the element.
     */
    insert(element: TItem, index: number): void;
    /**
     * Move one element from one index to another.
     * @param index The index of the element to move
     * @param targetIndex The index where the element should be after moving.
     */
    move(index: number, targetIndex: number): void;
    /**
     * Deletes an element at the specified index
     * @param index The index of the element to delete
     */
    delete(index: number): void;
    clear(): void;
    set(index: number, item: TItem): void;
    /**
     * Returns an Array of all the elements in the LiveList.
     */
    toArray(): TItem[];
    /**
     * Tests whether all elements pass the test implemented by the provided function.
     * @param predicate Function to test for each element, taking two arguments (the element and its index).
     * @returns true if the predicate function returns a truthy value for every element. Otherwise, false.
     */
    every(predicate: (value: TItem, index: number) => unknown): boolean;
    /**
     * Creates an array with all elements that pass the test implemented by the provided function.
     * @param predicate Function to test each element of the LiveList. Return a value that coerces to true to keep the element, or to false otherwise.
     * @returns An array with the elements that pass the test.
     */
    filter(predicate: (value: TItem, index: number) => unknown): TItem[];
    /**
     * Returns the first element that satisfies the provided testing function.
     * @param predicate Function to execute on each value.
     * @returns The value of the first element in the LiveList that satisfies the provided testing function. Otherwise, undefined is returned.
     */
    find(predicate: (value: TItem, index: number) => unknown): TItem | undefined;
    /**
     * Returns the index of the first element in the LiveList that satisfies the provided testing function.
     * @param predicate Function to execute on each value until the function returns true, indicating that the satisfying element was found.
     * @returns The index of the first element in the LiveList that passes the test. Otherwise, -1.
     */
    findIndex(predicate: (value: TItem, index: number) => unknown): number;
    /**
     * Executes a provided function once for each element.
     * @param callbackfn Function to execute on each element.
     */
    forEach(callbackfn: (value: TItem, index: number) => void): void;
    /**
     * Get the element at the specified index.
     * @param index The index on the element to get.
     * @returns The element at the specified index or undefined.
     */
    get(index: number): TItem | undefined;
    /**
     * Returns the first index at which a given element can be found in the LiveList, or -1 if it is not present.
     * @param searchElement Element to locate.
     * @param fromIndex The index to start the search at.
     * @returns The first index of the element in the LiveList; -1 if not found.
     */
    indexOf(searchElement: TItem, fromIndex?: number): number;
    /**
     * Returns the last index at which a given element can be found in the LiveList, or -1 if it is not present. The LiveLsit is searched backwards, starting at fromIndex.
     * @param searchElement Element to locate.
     * @param fromIndex The index at which to start searching backwards.
     * @returns
     */
    lastIndexOf(searchElement: TItem, fromIndex?: number): number;
    /**
     * Creates an array populated with the results of calling a provided function on every element.
     * @param callback Function that is called for every element.
     * @returns An array with each element being the result of the callback function.
     */
    map<U>(callback: (value: TItem, index: number) => U): U[];
    /**
     * Tests whether at least one element in the LiveList passes the test implemented by the provided function.
     * @param predicate Function to test for each element.
     * @returns true if the callback function returns a truthy value for at least one element. Otherwise, false.
     */
    some(predicate: (value: TItem, index: number) => unknown): boolean;
    [Symbol.iterator](): IterableIterator<TItem>;
    toImmutable(): readonly ToImmutable<TItem>[];
    clone(): LiveList<TItem>;
}

/**
 * INTERNAL
 */
declare class LiveRegister<TValue extends Json> extends AbstractCrdt {
    constructor(data: TValue);
    get data(): TValue;
    clone(): TValue;
}

declare type LiveStructure = LiveObject<LsonObject> | LiveList<Lson> | LiveMap<string, Lson> | LiveAsyncRegister<LiveObject<LsonObject>>;
/**
 * Think of Lson as a sibling of the Json data tree, except that the nested
 * data structure can contain a mix of Json values and LiveStructure instances.
 */
declare type Lson = Json | LiveStructure;
/**
 * LiveNode is the internal tree for managing Live data structures. The key
 * difference with Lson is that all the Json values get represented in
 * a LiveRegister node.
 */
declare type LiveNode = LiveStructure | LiveRegister<Json>;
/**
 * A mapping of keys to Lson values. A Lson value is any valid JSON
 * value or a Live storage data structure (LiveMap, LiveList, etc.)
 */
declare type LsonObject = {
    [key: string]: Lson | undefined;
};
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
declare type ToJson<T extends Lson | LsonObject> = T extends Json ? T : T extends LsonObject ? {
    [K in keyof T]: ToJson<Exclude<T[K], undefined>> | (undefined extends T[K] ? undefined : never);
} : T extends LiveList<infer I> ? ToJson<I>[] : T extends LiveObject<infer O> ? ToJson<O> : T extends LiveMap<infer KS, infer V> ? {
    [K in KS]: ToJson<V>;
} : T extends LiveAsyncRegister<infer V> ? {
    asyncId: string;
    asyncType: string;
    data: ToJson<V> | null;
} : never;

declare type LiveObjectUpdateDelta<O extends {
    [key: string]: unknown;
}> = {
    [K in keyof O]?: UpdateDelta | undefined;
};
/**
 * A LiveObject notification that is sent in-client to any subscribers whenever
 * one or more of the entries inside the LiveObject instance have changed.
 */
declare type LiveObjectUpdates<TData extends LsonObject> = {
    type: "LiveObject";
    node: LiveObject<TData>;
    updates: LiveObjectUpdateDelta<TData>;
};
/**
 * The LiveObject class is similar to a JavaScript object that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
declare class LiveObject<O extends LsonObject> extends AbstractCrdt {
    #private;
    constructor(obj?: O);
    /**
     * Transform the LiveObject into a javascript object
     */
    toObject(): O;
    /**
     * Adds or updates a property with a specified key and a value.
     * @param key The key of the property to add
     * @param value The value of the property to add
     */
    set<TKey extends keyof O>(key: TKey, value: O[TKey]): void;
    /**
     * Returns a specified property from the LiveObject.
     * @param key The key of the property to get
     */
    get<TKey extends keyof O>(key: TKey): O[TKey];
    /**
     * Deletes a key from the LiveObject
     * @param key The key of the property to delete
     */
    delete(key: keyof O): void;
    /**
     * Adds or updates multiple properties at once with an object.
     * @param patch The object used to overrides properties
     */
    update(patch: Partial<O>): void;
    toImmutable(): ToImmutable<O>;
    clone(): LiveObject<O>;
}

declare type DateToString<T> = {
    [P in keyof T]: T[P] extends Date ? string : T[P] extends Date | null ? string | null : T[P] extends Date | undefined ? string | undefined : T[P];
};

declare type InboxNotificationThreadData = {
    kind: "thread";
    id: string;
    roomId: string;
    threadId: string;
    notifiedAt: Date;
    readAt: Date | null;
};
declare type InboxNotificationTextMentionData = {
    kind: "textMention";
    id: string;
    roomId: string;
    notifiedAt: Date;
    readAt: Date | null;
    createdBy: string;
    mentionId: string;
};
declare type InboxNotificationTextMentionDataPlain = DateToString<InboxNotificationTextMentionData>;
declare type ActivityData = Record<string, string | boolean | number | undefined>;
declare type InboxNotificationActivity<K extends keyof DAD = keyof DAD> = {
    id: string;
    createdAt: Date;
    data: DAD[K];
};
declare type InboxNotificationCustomData<K extends keyof DAD = keyof DAD> = {
    kind: K;
    id: string;
    roomId?: string;
    subjectId: string;
    notifiedAt: Date;
    readAt: Date | null;
    activities: InboxNotificationActivity<K>[];
};
declare type InboxNotificationData = InboxNotificationThreadData | InboxNotificationCustomData | InboxNotificationTextMentionData;
declare type InboxNotificationThreadDataPlain = DateToString<InboxNotificationThreadData>;
declare type InboxNotificationCustomDataPlain = Omit<DateToString<InboxNotificationCustomData>, "activities"> & {
    activities: DateToString<InboxNotificationActivity>[];
};
declare type InboxNotificationDataPlain = InboxNotificationThreadDataPlain | InboxNotificationCustomDataPlain | InboxNotificationTextMentionDataPlain;
declare type InboxNotificationDeleteInfo = {
    type: "deletedInboxNotification";
    id: string;
    roomId: string;
    deletedAt: Date;
};

declare type BaseActivitiesData = {
    [key: `$${string}`]: ActivityData;
};

declare type BaseRoomInfo = {
    [key: string]: Json | undefined;
    /**
     * The name of the room.
     */
    name?: string;
    /**
     * The URL of the room.
     */
    url?: string;
};

declare type BaseMetadata = Record<string, string | boolean | number | undefined>;
declare type CommentReaction = {
    emoji: string;
    createdAt: Date;
    users: {
        id: string;
    }[];
};
/**
 * Represents a comment.
 */
declare type CommentData = {
    type: "comment";
    id: string;
    threadId: string;
    roomId: string;
    userId: string;
    createdAt: Date;
    editedAt?: Date;
    reactions: CommentReaction[];
} & ({
    body: CommentBody;
    deletedAt?: never;
} | {
    body?: never;
    deletedAt: Date;
});
declare type CommentDataPlain = Omit<DateToString<CommentData>, "reactions" | "body"> & {
    reactions: DateToString<CommentReaction>[];
} & ({
    body: CommentBody;
    deletedAt?: never;
} | {
    body?: never;
    deletedAt: string;
});
declare type CommentBodyBlockElement = CommentBodyParagraph;
declare type CommentBodyInlineElement = CommentBodyText | CommentBodyMention | CommentBodyLink;
declare type CommentBodyElement = CommentBodyBlockElement | CommentBodyInlineElement;
declare type CommentBodyParagraph = {
    type: "paragraph";
    children: CommentBodyInlineElement[];
};
declare type CommentBodyMention = {
    type: "mention";
    id: string;
};
declare type CommentBodyLink = {
    type: "link";
    url: string;
    text?: string;
};
declare type CommentBodyText = {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean;
    text: string;
};
declare type CommentBody = {
    version: 1;
    content: CommentBodyBlockElement[];
};
declare type CommentUserReaction = {
    emoji: string;
    createdAt: Date;
    userId: string;
};
declare type CommentUserReactionPlain = DateToString<CommentUserReaction>;
/**
 * Represents a thread of comments.
 */
declare type ThreadData<M extends BaseMetadata = DM> = {
    type: "thread";
    id: string;
    roomId: string;
    createdAt: Date;
    updatedAt?: Date;
    comments: CommentData[];
    metadata: M;
    resolved: boolean;
};
interface ThreadDataWithDeleteInfo<M extends BaseMetadata = DM> extends ThreadData<M> {
    deletedAt?: Date;
}
declare type ThreadDataPlain<M extends BaseMetadata> = Omit<DateToString<ThreadData<M>>, "comments" | "metadata"> & {
    comments: CommentDataPlain[];
    metadata: M;
};
declare type ThreadDeleteInfo = {
    type: "deletedThread";
    id: string;
    roomId: string;
    deletedAt: Date;
};
declare type StringOperators<T> = T | {
    startsWith: string;
};
/**
 * This type can be used to build a metadata query string (compatible
 * with `@liveblocks/query-parser`) through a type-safe API.
 *
 * In addition to exact values (`:` in query string), it adds:
 * - to strings:
 *  - `startsWith` (`^` in query string)
 */
declare type QueryMetadata<M extends BaseMetadata> = {
    [K in keyof M]: string extends M[K] ? StringOperators<M[K]> : M[K];
};

declare global {
    /**
     * Namespace for user-defined Liveblocks types.
     */
    export interface Liveblocks {
        [key: string]: unknown;
    }
}
declare type ExtendableTypes = "Presence" | "Storage" | "UserMeta" | "RoomEvent" | "ThreadMetadata" | "RoomInfo" | "ActivitiesData";
declare type MakeErrorString<K extends ExtendableTypes, Reason extends string = "does not match its requirements"> = `The type you provided for '${K}' ${Reason}. To learn how to fix this, see https://liveblocks.io/docs/errors/${K}`;
declare type GetOverride<K extends ExtendableTypes, B, Reason extends string = "does not match its requirements"> = GetOverrideOrErrorValue<K, B, MakeErrorString<K, Reason>>;
declare type GetOverrideOrErrorValue<K extends ExtendableTypes, B, ErrorType> = unknown extends Liveblocks[K] ? B : Liveblocks[K] extends B ? Liveblocks[K] : ErrorType;
declare type DP = GetOverride<"Presence", JsonObject, "is not a valid JSON object">;
declare type DS = GetOverride<"Storage", LsonObject, "is not a valid LSON value">;
declare type DU = GetOverrideOrErrorValue<"UserMeta", BaseUserMeta, Record<"id" | "info", MakeErrorString<"UserMeta">>>;
declare type DE = GetOverride<"RoomEvent", Json, "is not a valid JSON value">;
declare type DM = GetOverride<"ThreadMetadata", BaseMetadata>;
declare type DRI = GetOverride<"RoomInfo", BaseRoomInfo>;
declare type DAD = GetOverrideOrErrorValue<"ActivitiesData", BaseActivitiesData, {
    [K in keyof Liveblocks["ActivitiesData"]]: "At least one of the custom notification kinds you provided for 'ActivitiesData' does not match its requirements. To learn how to fix this, see https://liveblocks.io/docs/errors/ActivitiesData";
}>;
declare type KDAD = keyof DAD extends `$${string}` ? keyof DAD : "Custom notification kinds must start with '$' but your custom 'ActivitiesData' type contains at least one kind which doesn't. To learn how to fix this, see https://liveblocks.io/docs/errors/ActivitiesData";

/**
 * Use this symbol to brand an object property as internal.
 *
 * @example
 * Object.defineProperty(
 *   {
 *     public,
 *     [kInternal]: {
 *       private
 *     },
 *   },
 *   kInternal,
 *   {
 *     enumerable: false,
 *   }
 * );
 */
declare const kInternal: unique symbol;

declare enum ClientMsgCode {
    UPDATE_PRESENCE = 100,
    BROADCAST_EVENT = 103,
    FETCH_STORAGE = 200,
    UPDATE_STORAGE = 201,
    FETCH_YDOC = 300,
    UPDATE_YDOC = 301
}
/**
 * Messages that can be sent from the client to the server.
 */
declare type ClientMsg<P extends JsonObject, E extends Json> = BroadcastEventClientMsg<E> | UpdatePresenceClientMsg<P> | UpdateStorageClientMsg | FetchStorageClientMsg | FetchYDocClientMsg | UpdateYDocClientMsg;
declare type BroadcastEventClientMsg<E extends Json> = {
    type: ClientMsgCode.BROADCAST_EVENT;
    event: E;
};
declare type UpdatePresenceClientMsg<P extends JsonObject> = {
    readonly type: ClientMsgCode.UPDATE_PRESENCE;
    /**
     * Set this to any number to signify that this is a Full Presence™
     * update, not a patch.
     *
     * The numeric value itself no longer has specific meaning. Historically,
     * this field was intended so that clients could ignore these broadcasted
     * full presence messages, but it turned out that getting a full presence
     * "keyframe" from time to time was useful.
     *
     * So nowadays, the presence (pun intended) of this `targetActor` field
     * is a backward-compatible way of expressing that the `data` contains
     * all presence fields, and isn't a partial "patch".
     */
    readonly targetActor: number;
    readonly data: P;
} | {
    readonly type: ClientMsgCode.UPDATE_PRESENCE;
    /**
     * Absence of the `targetActor` field signifies that this is a Partial
     * Presence™ "patch".
     */
    readonly targetActor?: undefined;
    readonly data: Partial<P>;
};
declare type UpdateStorageClientMsg = {
    readonly type: ClientMsgCode.UPDATE_STORAGE;
    readonly ops: Op[];
};
declare type FetchStorageClientMsg = {
    readonly type: ClientMsgCode.FETCH_STORAGE;
};
declare type FetchYDocClientMsg = {
    readonly type: ClientMsgCode.FETCH_YDOC;
    readonly vector: string;
    readonly guid?: string;
};
declare type UpdateYDocClientMsg = {
    readonly type: ClientMsgCode.UPDATE_YDOC;
    readonly update: string;
    readonly guid?: string;
};

declare type IdTuple<T> = [id: string, value: T];
declare enum CrdtType {
    OBJECT = 0,
    LIST = 1,
    MAP = 2,
    REGISTER = 3,
    ASYNC_REGISTER = 461
}
declare type SerializedCrdt = SerializedRootObject | SerializedChild;
declare type SerializedChild = SerializedObject | SerializedList | SerializedMap | SerializedRegister | SerializedAsyncRegister;
declare type SerializedRootObject = {
    readonly type: CrdtType.OBJECT;
    readonly data: JsonObject;
    readonly parentId?: never;
    readonly parentKey?: never;
};
declare type SerializedObject = {
    readonly type: CrdtType.OBJECT;
    readonly parentId: string;
    readonly parentKey: string;
    readonly data: JsonObject;
};
declare type SerializedList = {
    readonly type: CrdtType.LIST;
    readonly parentId: string;
    readonly parentKey: string;
};
declare type SerializedMap = {
    readonly type: CrdtType.MAP;
    readonly parentId: string;
    readonly parentKey: string;
};
declare type SerializedRegister = {
    readonly type: CrdtType.REGISTER;
    readonly parentId: string;
    readonly parentKey: string;
    readonly data: Json;
};
declare type SerializedAsyncRegister = {
    readonly type: CrdtType.ASYNC_REGISTER;
    readonly parentId: string;
    readonly parentKey: string;
    readonly asyncType?: string;
    readonly asyncId?: string;
};
declare function isRootCrdt(crdt: SerializedCrdt): crdt is SerializedRootObject;
declare function isChildCrdt(crdt: SerializedCrdt): crdt is SerializedChild;

declare enum ServerMsgCode {
    UPDATE_PRESENCE = 100,
    USER_JOINED = 101,
    USER_LEFT = 102,
    BROADCASTED_EVENT = 103,
    ROOM_STATE = 104,
    INITIAL_STORAGE_STATE = 200,
    INITIAL_ASYNC_REGISTER_STATE = 242,
    UPDATE_STORAGE = 201,
    REJECT_STORAGE_OP = 299,
    UPDATE_YDOC = 300,
    THREAD_CREATED = 400,
    THREAD_DELETED = 407,
    THREAD_METADATA_UPDATED = 401,
    THREAD_UPDATED = 408,
    COMMENT_CREATED = 402,
    COMMENT_EDITED = 403,
    COMMENT_DELETED = 404,
    COMMENT_REACTION_ADDED = 405,
    COMMENT_REACTION_REMOVED = 406
}
/**
 * Messages that can be sent from the server to the client.
 */
declare type ServerMsg<P extends JsonObject, U extends BaseUserMeta, E extends Json> = UpdatePresenceServerMsg<P> | UserJoinServerMsg<U> | UserLeftServerMsg | BroadcastedEventServerMsg<E> | RoomStateServerMsg<U> | InitialDocumentStateServerMsg | InitialAsyncRegisterStateServerMsg | UpdateStorageServerMsg | RejectedStorageOpServerMsg | YDocUpdateServerMsg | CommentsEventServerMsg;
declare type CommentsEventServerMsg = ThreadCreatedEvent | ThreadDeletedEvent | ThreadMetadataUpdatedEvent | ThreadUpdatedEvent | CommentCreatedEvent | CommentEditedEvent | CommentDeletedEvent | CommentReactionAdded | CommentReactionRemoved;
declare type ThreadCreatedEvent = {
    type: ServerMsgCode.THREAD_CREATED;
    threadId: string;
};
declare type ThreadDeletedEvent = {
    type: ServerMsgCode.THREAD_DELETED;
    threadId: string;
};
declare type ThreadMetadataUpdatedEvent = {
    type: ServerMsgCode.THREAD_METADATA_UPDATED;
    threadId: string;
};
declare type ThreadUpdatedEvent = {
    type: ServerMsgCode.THREAD_UPDATED;
    threadId: string;
};
declare type CommentCreatedEvent = {
    type: ServerMsgCode.COMMENT_CREATED;
    threadId: string;
    commentId: string;
};
declare type CommentEditedEvent = {
    type: ServerMsgCode.COMMENT_EDITED;
    threadId: string;
    commentId: string;
};
declare type CommentDeletedEvent = {
    type: ServerMsgCode.COMMENT_DELETED;
    threadId: string;
    commentId: string;
};
declare type CommentReactionAdded = {
    type: ServerMsgCode.COMMENT_REACTION_ADDED;
    threadId: string;
    commentId: string;
    emoji: string;
};
declare type CommentReactionRemoved = {
    type: ServerMsgCode.COMMENT_REACTION_REMOVED;
    threadId: string;
    commentId: string;
    emoji: string;
};
/**
 * Sent by the WebSocket server and broadcasted to all clients to announce that
 * a User updated their presence. For example, when a user moves their cursor.
 *
 * In most cases, the data payload will only include the fields from the
 * Presence that have been changed since the last announcement. However, after
 * a new user joins a room, a "full presence" will be announced so the newly
 * connected user will get each other's user full presence at least once. In
 * those cases, the `targetActor` field indicates the newly connected client,
 * so all other existing clients can ignore this broadcasted message.
 */
declare type UpdatePresenceServerMsg<P extends JsonObject> = {
    readonly type: ServerMsgCode.UPDATE_PRESENCE;
    /**
     * The User whose Presence has changed.
     */
    readonly actor: number;
    /**
     * When set, signifies that this is a Full Presence™ update, not a patch.
     *
     * The numeric value itself no longer has specific meaning. Historically,
     * this field was intended so that clients could ignore these broadcasted
     * full presence messages, but it turned out that getting a full presence
     * "keyframe" from time to time was useful.
     *
     * So nowadays, the presence (pun intended) of this `targetActor` field
     * is a backward-compatible way of expressing that the `data` contains
     * all presence fields, and isn't a partial "patch".
     */
    readonly targetActor: number;
    /**
     * The partial or full Presence of a User. If the `targetActor` field is set,
     * this will be the full Presence, otherwise it only contain the fields that
     * have changed since the last broadcast.
     */
    readonly data: P;
} | {
    readonly type: ServerMsgCode.UPDATE_PRESENCE;
    /**
     * The User whose Presence has changed.
     */
    readonly actor: number;
    /**
     * Not set for partial presence updates.
     */
    readonly targetActor?: undefined;
    /**
     * A partial Presence patch to apply to the User. It will only contain the
     * fields that have changed since the last broadcast.
     */
    readonly data: Partial<P>;
};
/**
 * Sent by the WebSocket server and broadcasted to all clients to announce that
 * a new User has joined the Room.
 */
declare type UserJoinServerMsg<U extends BaseUserMeta> = {
    readonly type: ServerMsgCode.USER_JOINED;
    readonly actor: number;
    /**
     * The id of the User that has been set in the authentication endpoint.
     * Useful to get additional information about the connected user.
     */
    readonly id: U["id"];
    /**
     * Additional user information that has been set in the authentication
     * endpoint.
     */
    readonly info: U["info"];
    /**
     * Informs the client what (public) permissions this (other) User has.
     */
    readonly scopes: string[];
};
/**
 * Sent by the WebSocket server and broadcasted to all clients to announce that
 * a new User has left the Room.
 */
declare type UserLeftServerMsg = {
    readonly type: ServerMsgCode.USER_LEFT;
    readonly actor: number;
};
/**
 * Sent by the WebSocket server when the ydoc is updated or when requested based on stateVector passed.
 * Contains a base64 encoded update
 */
declare type YDocUpdateServerMsg = {
    readonly type: ServerMsgCode.UPDATE_YDOC;
    readonly update: string;
    readonly isSync: boolean;
    readonly stateVector: string | null;
    readonly guid?: string;
};
/**
 * Sent by the WebSocket server and broadcasted to all clients to announce that
 * a User broadcasted an Event to everyone in the Room.
 */
declare type BroadcastedEventServerMsg<E extends Json> = {
    readonly type: ServerMsgCode.BROADCASTED_EVENT;
    /**
     * The User who broadcast the Event. Absent when this event is broadcast from
     * the REST API in the backend.
     */
    readonly actor: number;
    /**
     * The arbitrary payload of the Event. This can be any JSON value. Clients
     * will have to manually verify/decode this event.
     */
    readonly event: E;
};
/**
 * Sent by the WebSocket server to a single client in response to the client
 * joining the Room, to provide the initial state of the Room. The payload
 * includes a list of all other Users that already are in the Room.
 */
declare type RoomStateServerMsg<U extends BaseUserMeta> = {
    readonly type: ServerMsgCode.ROOM_STATE;
    /**
     * Informs the client what their actor ID is going to be.
     * @since v1.2 (WS API v7)
     */
    readonly actor: number;
    /**
     * Secure nonce for the current session.
     * @since v1.2 (WS API v7)
     */
    readonly nonce: string;
    /**
     * Informs the client what permissions the current User (self) has.
     * @since v1.2 (WS API v7)
     */
    readonly scopes: string[];
    readonly users: {
        readonly [otherActor: number]: U & {
            scopes: string[];
        };
    };
};
/**
 * Sent by the WebSocket server to a single client in response to the client
 * joining the Room, to provide the initial Storage state of the Room. The
 * payload includes the entire Storage document.
 */
declare type InitialDocumentStateServerMsg = {
    readonly type: ServerMsgCode.INITIAL_STORAGE_STATE;
    readonly items: IdTuple<SerializedCrdt>[];
};
/**
 * Sent by the WebSocket server to a single client in response to the client
 * joining the Room, to provide the initial async register state state of the Room. The
 * payload includes the entire async register subtree state.
 */
declare type InitialAsyncRegisterStateServerMsg = {
    readonly type: ServerMsgCode.INITIAL_ASYNC_REGISTER_STATE;
    readonly items: IdTuple<SerializedCrdt>[];
    readonly rootId: string;
    readonly rootParentId: string;
};
/**
 * Sent by the WebSocket server and broadcasted to all clients to announce that
 * a change occurred in the Storage document.
 *
 * The payload of this message contains a list of Ops (aka incremental
 * mutations to make to the initially loaded document).
 */
declare type UpdateStorageServerMsg = {
    readonly type: ServerMsgCode.UPDATE_STORAGE;
    readonly ops: Op[];
};
/**
 * Sent by the WebSocket server to the client to indicate that certain opIds
 * have been received but were rejected because they caused mutations that are
 * incompatible with the Room's schema.
 */
declare type RejectedStorageOpServerMsg = {
    readonly type: ServerMsgCode.REJECT_STORAGE_OP;
    readonly opIds: string[];
    readonly reason: string;
};

declare type JsonTreeNode = {
    readonly type: "Json";
    readonly id: string;
    readonly key: string;
    readonly payload: Json;
};
declare type LiveTreeNode<TName extends `Live${string}` = `Live${string}`> = {
    readonly type: TName;
    readonly id: string;
    readonly key: string;
    readonly payload: LsonTreeNode[];
};
declare type LsonTreeNode = LiveTreeNode | JsonTreeNode;
declare type UserTreeNode = {
    readonly type: "User";
    readonly id: string;
    readonly key: string;
    readonly payload: {
        readonly connectionId: number;
        readonly id?: string;
        readonly info?: Json;
        readonly presence: JsonObject;
        readonly isReadOnly: boolean;
    };
};
declare type CustomEventTreeNode = {
    readonly type: "CustomEvent";
    readonly id: string;
    readonly key: string;
    readonly connectionId: number;
    readonly payload: Json;
};
declare type TreeNode = LsonTreeNode | UserTreeNode | CustomEventTreeNode;

type DevToolsTreeNode_CustomEventTreeNode = CustomEventTreeNode;
type DevToolsTreeNode_JsonTreeNode = JsonTreeNode;
type DevToolsTreeNode_LiveTreeNode<TName extends `Live${string}` = `Live${string}`> = LiveTreeNode<TName>;
type DevToolsTreeNode_LsonTreeNode = LsonTreeNode;
type DevToolsTreeNode_TreeNode = TreeNode;
type DevToolsTreeNode_UserTreeNode = UserTreeNode;
declare namespace DevToolsTreeNode {
  export type { DevToolsTreeNode_CustomEventTreeNode as CustomEventTreeNode, DevToolsTreeNode_JsonTreeNode as JsonTreeNode, DevToolsTreeNode_LiveTreeNode as LiveTreeNode, DevToolsTreeNode_LsonTreeNode as LsonTreeNode, DevToolsTreeNode_TreeNode as TreeNode, DevToolsTreeNode_UserTreeNode as UserTreeNode };
}

/**
 * This helper type is effectively a no-op, but will force TypeScript to
 * "evaluate" any named helper types in its definition. This can sometimes make
 * API signatures clearer in IDEs.
 *
 * For example, in:
 *
 *   type Payload<T> = { data: T };
 *
 *   let r1: Payload<string>;
 *   let r2: Resolve<Payload<string>>;
 *
 * The inferred type of `r1` is going to be `Payload<string>` which shows up in
 * editor hints, and it may be unclear what's inside if you don't know the
 * definition of `Payload`.
 *
 * The inferred type of `r2` is going to be `{ data: string }`, which may be
 * more helpful.
 *
 * This trick comes from:
 * https://effectivetypescript.com/2022/02/25/gentips-4-display/
 */
declare type Resolve<T> = T extends (...args: unknown[]) => unknown ? T : {
    [K in keyof T]: T[K];
};

/**
 * Represents a user connected in a room. Treated as immutable.
 */
declare type User<P extends JsonObject = DP, U extends BaseUserMeta = DU> = {
    /**
     * The connection ID of the User. It is unique and increment at every new connection.
     */
    readonly connectionId: number;
    /**
     * The ID of the User that has been set in the authentication endpoint.
     * Useful to get additional information about the connected user.
     */
    readonly id: U["id"];
    /**
     * Additional user information that has been set in the authentication endpoint.
     */
    readonly info: U["info"];
    /**
     * The user’s presence data.
     */
    readonly presence: P;
    /**
     * True if the user can mutate the Room’s Storage and/or YDoc, false if they
     * can only read but not mutate it.
     */
    readonly canWrite: boolean;
    /**
     * True if the user can comment on a thread
     */
    readonly canComment: boolean;
};

declare type InternalOthersEvent<P extends JsonObject, U extends BaseUserMeta> = {
    type: "leave";
    user: User<P, U>;
} | {
    type: "enter";
    user: User<P, U>;
} | {
    type: "update";
    user: User<P, U>;
    updates: Partial<P>;
} | {
    type: "reset";
    user?: never;
};
declare type OthersEvent<P extends JsonObject = DP, U extends BaseUserMeta = DU> = Resolve<InternalOthersEvent<P, U> & {
    others: readonly User<P, U>[];
}>;

declare type OptionalKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];
declare type MakeOptionalFieldsNullable<T> = {
    [K in keyof T]: K extends OptionalKeys<T> ? T[K] | null : T[K];
};
declare type Patchable<T> = Partial<MakeOptionalFieldsNullable<T>>;

declare type RoomThreadsNotificationSettings = "all" | "replies_and_mentions" | "none";
declare type RoomNotificationSettings = {
    threads: RoomThreadsNotificationSettings;
};

declare type LegacyOthersEvent<P extends JsonObject, U extends BaseUserMeta> = {
    type: "leave";
    user: User<P, U>;
} | {
    type: "enter";
    user: User<P, U>;
} | {
    type: "update";
    user: User<P, U>;
    updates: Partial<P>;
} | {
    type: "reset";
};
declare type LegacyOthersEventCallback<P extends JsonObject, U extends BaseUserMeta> = (others: readonly User<P, U>[], event: LegacyOthersEvent<P, U>) => void;
declare type RoomEventMessage<P extends JsonObject, U extends BaseUserMeta, E extends Json> = {
    /**
     * The connection ID of the client that sent the event.
     * If this message was broadcast from the server (via the REST API), then
     * this value will be -1.
     */
    connectionId: number;
    /**
     * The User (from the others list) that sent the event.
     * If this message was broadcast from the server (via the REST API), then
     * this value will be null.
     */
    user: User<P, U> | null;
    event: E;
};
declare type StorageStatus = "not-loaded" | "loading" | "synchronizing" | "synchronized";
interface History {
    /**
     * Undoes the last operation executed by the current client.
     * It does not impact operations made by other clients.
     *
     * @example
     * room.updatePresence({ selectedId: "xx" }, { addToHistory: true });
     * room.updatePresence({ selectedId: "yy" }, { addToHistory: true });
     * room.history.undo();
     * // room.getPresence() equals { selectedId: "xx" }
     */
    undo: () => void;
    /**
     * Redoes the last operation executed by the current client.
     * It does not impact operations made by other clients.
     *
     * @example
     * room.updatePresence({ selectedId: "xx" }, { addToHistory: true });
     * room.updatePresence({ selectedId: "yy" }, { addToHistory: true });
     * room.history.undo();
     * // room.getPresence() equals { selectedId: "xx" }
     * room.history.redo();
     * // room.getPresence() equals { selectedId: "yy" }
     */
    redo: () => void;
    /**
     * Returns whether there are any operations to undo.
     *
     * @example
     * room.updatePresence({ selectedId: "xx" }, { addToHistory: true });
     * // room.history.canUndo() is true
     * room.history.undo();
     * // room.history.canUndo() is false
     */
    canUndo: () => boolean;
    /**
     * Returns whether there are any operations to redo.
     *
     * @example
     * room.updatePresence({ selectedId: "xx" }, { addToHistory: true });
     * room.history.undo();
     * // room.history.canRedo() is true
     * room.history.redo();
     * // room.history.canRedo() is false
     */
    canRedo: () => boolean;
    /**
     * Clears the undo and redo stacks. This operation cannot be undone ;)
     */
    clear: () => void;
    /**
     * All future modifications made on the Room will be merged together to create a single history item until resume is called.
     *
     * @example
     * room.updatePresence({ cursor: { x: 0, y: 0 } }, { addToHistory: true });
     * room.history.pause();
     * room.updatePresence({ cursor: { x: 1, y: 1 } }, { addToHistory: true });
     * room.updatePresence({ cursor: { x: 2, y: 2 } }, { addToHistory: true });
     * room.history.resume();
     * room.history.undo();
     * // room.getPresence() equals { cursor: { x: 0, y: 0 } }
     */
    pause: () => void;
    /**
     * Resumes history. Modifications made on the Room are not merged into a single history item anymore.
     *
     * @example
     * room.updatePresence({ cursor: { x: 0, y: 0 } }, { addToHistory: true });
     * room.history.pause();
     * room.updatePresence({ cursor: { x: 1, y: 1 } }, { addToHistory: true });
     * room.updatePresence({ cursor: { x: 2, y: 2 } }, { addToHistory: true });
     * room.history.resume();
     * room.history.undo();
     * // room.getPresence() equals { cursor: { x: 0, y: 0 } }
     */
    resume: () => void;
}
declare type HistoryEvent = {
    canUndo: boolean;
    canRedo: boolean;
};
declare type BroadcastOptions = {
    /**
     * Whether or not event is queued if the connection is currently closed.
     *
     * ❗ We are not sure if we want to support this option in the future so it might be deprecated to be replaced by something else
     */
    shouldQueueEventIfNotReady: boolean;
};
declare type SubscribeFn<P extends JsonObject, _TStorage extends LsonObject, U extends BaseUserMeta, E extends Json> = {
    /**
     * Subscribe to the current user presence updates.
     *
     * @param listener the callback that is called every time the current user presence is updated with {@link Room.updatePresence}.
     *
     * @returns Unsubscribe function.
     *
     * @example
     * room.subscribe("my-presence", (presence) => {
     *   // Do something
     * });
     */
    (type: "my-presence", listener: Callback<P>): () => void;
    /**
     * Subscribe to the other users updates.
     *
     * @param listener the callback that is called when a user enters or leaves the room or when a user update its presence.
     *
     * @returns Unsubscribe function.
     *
     * @example
     * room.subscribe("others", (others) => {
     *   // Do something
     * });
     *
     */
    (type: "others", listener: LegacyOthersEventCallback<P, U>): () => void;
    /**
     * Subscribe to events broadcasted by {@link Room.broadcastEvent}
     *
     * @param listener the callback that is called when a user calls {@link Room.broadcastEvent}
     *
     * @returns Unsubscribe function.
     *
     * @example
     * room.subscribe("event", ({ event, connectionId }) => {
     *   // Do something
     * });
     *
     */
    (type: "event", listener: Callback<RoomEventMessage<P, U, E>>): () => void;
    /**
     * Subscribe to errors thrown in the room.
     *
     * @returns Unsubscribe function.
     *
     */
    (type: "error", listener: Callback<LiveblocksError>): () => void;
    /**
     * Subscribe to connection status updates. The callback will be called any
     * time the status changes.
     *
     * @returns Unsubscribe function.
     *
     */
    (type: "status", listener: Callback<Status>): () => void;
    /**
     * Subscribe to the exceptional event where reconnecting to the Liveblocks
     * servers is taking longer than usual. This typically is a sign of a client
     * that has lost internet connectivity.
     *
     * This isn't problematic (because the Liveblocks client is still trying to
     * reconnect), but it's typically a good idea to inform users about it if
     * the connection takes too long to recover.
     */
    (type: "lost-connection", listener: Callback<LostConnectionEvent>): () => void;
    /**
     * Subscribes to changes made on a Live structure. Returns an unsubscribe function.
     *
     * @param callback The callback this called when the Live structure changes.
     *
     * @returns Unsubscribe function.
     *
     * @example
     * const liveMap = new LiveMap();  // Could also be LiveList or LiveObject
     * const unsubscribe = room.subscribe(liveMap, (liveMap) => { });
     * unsubscribe();
     */
    <L extends LiveStructure>(liveStructure: L, callback: (node: L) => void): () => void;
    /**
     * Subscribes to changes made on a Live structure and all the nested data
     * structures. Returns an unsubscribe function. In a future version, we
     * will also expose what exactly changed in the Live structure.
     *
     * @param callback The callback this called when the Live structure, or any
     * of its nested values, changes.
     *
     * @returns Unsubscribe function.
     *
     * @example
     * const liveMap = new LiveMap();  // Could also be LiveList or LiveObject
     * const unsubscribe = room.subscribe(liveMap, (updates) => { }, { isDeep: true });
     * unsubscribe();
     */
    <L extends LiveStructure>(liveStructure: L, callback: StorageCallback, options: {
        isDeep: true;
    }): () => void;
    /**
     * Subscribe to the current user's history changes.
     *
     * @returns Unsubscribe function.
     *
     * @example
     * room.subscribe("history", ({ canUndo, canRedo }) => {
     *   // Do something
     * });
     */
    (type: "history", listener: Callback<HistoryEvent>): () => void;
    /**
     * Subscribe to storage status changes.
     *
     * @returns Unsubscribe function.
     *
     * @example
     * room.subscribe("storage-status", (status) => {
     *   switch(status) {
     *      case "not-loaded":
     *        break;
     *      case "loading":
     *        break;
     *      case "synchronizing":
     *        break;
     *      case "synchronized":
     *        break;
     *      default:
     *        break;
     *   }
     * });
     */
    (type: "storage-status", listener: Callback<StorageStatus>): () => void;
    (type: "comments", listener: Callback<CommentsEventServerMsg>): () => void;
};
declare type GetThreadsOptions<M extends BaseMetadata> = {
    query?: {
        resolved?: boolean;
        metadata?: Partial<QueryMetadata<M>>;
    };
};
declare type CommentsApi<M extends BaseMetadata> = {
    /**
     * Returns the threads within the current room and their associated inbox notifications.
     * It also returns the request date that can be used for subsequent polling.
     *
     * @example
     * const {
     *   threads,
     *   inboxNotifications,
     *   requestedAt
     * } = await room.getThreads({ query: { resolved: false }});
     */
    getThreads(options?: GetThreadsOptions<M>): Promise<{
        threads: ThreadData<M>[];
        inboxNotifications: InboxNotificationData[];
        requestedAt: Date;
    }>;
    /**
     * Returns the updated and deleted threads and their associated inbox notifications since the requested date.
     *
     * @example
     * const result = await room.getThreads();
     * // ... //
     * await room.getThreadsSince({ since: result.requestedAt });
     */
    getThreadsSince(options: {
        since: Date;
    }): Promise<{
        threads: {
            updated: ThreadData<M>[];
            deleted: ThreadDeleteInfo[];
        };
        inboxNotifications: {
            updated: InboxNotificationData[];
            deleted: InboxNotificationDeleteInfo[];
        };
        requestedAt: Date;
    }>;
    /**
     * Returns a thread and the associated inbox notification if it exists.
     *
     * @example
     * const { thread, inboxNotification } = await room.getThread("th_xxx");
     */
    getThread(threadId: string): Promise<{
        thread?: ThreadData<M>;
        inboxNotification?: InboxNotificationData;
    }>;
    /**
     * Creates a thread.
     *
     * @example
     * const thread = await room.createThread({
     *   body: {
     *     version: 1,
     *     content: [{ type: "paragraph", children: [{ text: "Hello" }] }],
     *   },
     * })
     */
    createThread(options: {
        threadId?: string;
        commentId?: string;
        metadata: M | undefined;
        body: CommentBody;
    }): Promise<ThreadData<M>>;
    /**
     * Deletes a thread.
     *
     * @example
     * await room.deleteThread("th_xxx");
     */
    deleteThread(threadId: string): Promise<void>;
    /**
     * Edits a thread's metadata.
     * To delete an existing metadata property, set its value to `null`.
     *
     * @example
     * await room.editThreadMetadata({ threadId: "th_xxx", metadata: { x: 100, y: 100 } })
     */
    editThreadMetadata(options: {
        metadata: Patchable<M>;
        threadId: string;
    }): Promise<M>;
    /**
     * Marks a thread as resolved.
     *
     * @example
     * await room.markThreadAsResolved("th_xxx");
     */
    markThreadAsResolved(threadId: string): Promise<void>;
    /**
     * Marks a thread as unresolved.
     *
     * @example
     * await room.markThreadAsUnresolved("th_xxx");
     */
    markThreadAsUnresolved(threadId: string): Promise<void>;
    /**
     * Creates a comment.
     *
     * @example
     * await room.createComment({
     *   threadId: "th_xxx",
     *   body: {
     *     version: 1,
     *     content: [{ type: "paragraph", children: [{ text: "Hello" }] }],
     *   },
     * });
     */
    createComment(options: {
        threadId: string;
        commentId?: string;
        body: CommentBody;
    }): Promise<CommentData>;
    /**
     * Edits a comment.
     *
     * @example
     * await room.editComment({
     *   threadId: "th_xxx",
     *   commentId: "cm_xxx"
     *   body: {
     *     version: 1,
     *     content: [{ type: "paragraph", children: [{ text: "Hello" }] }],
     *   },
     * });
     */
    editComment(options: {
        threadId: string;
        commentId: string;
        body: CommentBody;
    }): Promise<CommentData>;
    /**
     * Deletes a comment.
     * If it is the last non-deleted comment, the thread also gets deleted.
     *
     * @example
     * await room.deleteComment({
     *   threadId: "th_xxx",
     *   commentId: "cm_xxx"
     * });
     */
    deleteComment(options: {
        threadId: string;
        commentId: string;
    }): Promise<void>;
    /**
     * Adds a reaction from a comment for the current user.
     *
     * @example
     * await room.addReaction({ threadId: "th_xxx", commentId: "cm_xxx", emoji: "👍" })
     */
    addReaction(options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }): Promise<CommentUserReaction>;
    /**
     * Removes a reaction from a comment.
     *
     * @example
     * await room.removeReaction({ threadId: "th_xxx", commentId: "cm_xxx", emoji: "👍" })
     */
    removeReaction(options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }): Promise<void>;
};
/**
 * @private Widest-possible Room type, matching _any_ Room instance. Note that
 * this type is different from `Room`-without-type-arguments. That represents
 * a Room instance using globally augmented types only, which is narrower.
 */
declare type OpaqueRoom = Room<JsonObject, LsonObject, BaseUserMeta, Json, BaseMetadata>;
declare type Room<P extends JsonObject = DP, S extends LsonObject = DS, U extends BaseUserMeta = DU, E extends Json = DE, M extends BaseMetadata = DM> = {
    /**
     * @private
     *
     * Private methods and variables used in the core internals, but as a user
     * of Liveblocks, NEVER USE ANY OF THESE DIRECTLY, because bad things
     * will probably happen if you do.
     */
    readonly [kInternal]: PrivateRoomApi;
    /**
     * The id of the room.
     */
    readonly id: string;
    /**
     * Return the current connection status for this room. Can be used to display
     * a status badge for your Liveblocks connection.
     */
    getStatus(): Status;
    readonly subscribe: SubscribeFn<P, S, U, E>;
    /**
     * Room's history contains functions that let you undo and redo operation made on by the current client on the presence and storage.
     */
    readonly history: History;
    /**
     * Gets the current user.
     * Returns null if not it is not yet connected to the room.
     *
     * @example
     * const user = room.getSelf();
     */
    getSelf(): User<P, U> | null;
    /**
     * Gets the presence of the current user.
     *
     * @example
     * const presence = room.getPresence();
     */
    getPresence(): P;
    /**
     * Gets all the other users in the room.
     *
     * @example
     * const others = room.getOthers();
     */
    getOthers(): readonly User<P, U>[];
    /**
     * Updates the presence of the current user. Only pass the properties you want to update. No need to send the full presence.
     * @param patch A partial object that contains the properties you want to update.
     * @param options Optional object to configure the behavior of updatePresence.
     *
     * @example
     * room.updatePresence({ x: 0 });
     * room.updatePresence({ y: 0 });
     *
     * const presence = room.getPresence();
     * // presence is equivalent to { x: 0, y: 0 }
     */
    updatePresence(patch: Partial<P>, options?: {
        /**
         * Whether or not the presence should have an impact on the undo/redo history.
         */
        addToHistory: boolean;
    }): void;
    /**
     * Sends Yjs document updates to Liveblocks server.
     *
     * @param {string} data the doc update to send to the server, base64 encoded uint8array
     */
    updateYDoc(data: string, guid?: string): void;
    /**
     * Sends a request for the current document from liveblocks server
     */
    fetchYDoc(stateVector: string, guid?: string): void;
    /**
     * Broadcasts an event to other users in the room. Event broadcasted to the room can be listened with {@link Room.subscribe}("event").
     * @param {any} event the event to broadcast. Should be serializable to JSON
     *
     * @example
     * // On client A
     * room.broadcastEvent({ type: "EMOJI", emoji: "🔥" });
     *
     * // On client B
     * room.subscribe("event", ({ event }) => {
     *   if(event.type === "EMOJI") {
     *     // Do something
     *   }
     * });
     */
    broadcastEvent(event: E, options?: BroadcastOptions): void;
    /**
     * Get the room's storage asynchronously.
     * The storage's root is a {@link LiveObject}.
     *
     * @example
     * const { root } = await room.getStorage();
     */
    getStorage(): Promise<{
        root: LiveObject<S>;
    }>;
    /**
     * Get the room's storage synchronously.
     * The storage's root is a {@link LiveObject}.
     *
     * @example
     * const root = room.getStorageSnapshot();
     */
    getStorageSnapshot(): LiveObject<S> | null;
    /**
     * All possible room events, subscribable from a single place.
     *
     * @private These event sources are private for now, but will become public
     * once they're stable.
     */
    readonly events: {
        readonly status: Observable<Status>;
        readonly lostConnection: Observable<LostConnectionEvent>;
        readonly customEvent: Observable<RoomEventMessage<P, U, E>>;
        readonly self: Observable<User<P, U>>;
        readonly myPresence: Observable<P>;
        readonly others: Observable<OthersEvent<P, U>>;
        readonly error: Observable<LiveblocksError>;
        /**
         * @deprecated Renamed to `storageBatch`. The `storage` event source will
         * soon be replaced by another/incompatible API.
         */
        readonly storage: Observable<StorageUpdate[]>;
        readonly storageBatch: Observable<StorageUpdate[]>;
        readonly history: Observable<HistoryEvent>;
        /**
         * Subscribe to the storage loaded event. Will fire any time a full Storage
         * copy is downloaded. (This happens after the initial connect, and on
         * every reconnect.)
         */
        readonly storageDidLoad: Observable<void>;
        readonly storageStatus: Observable<StorageStatus>;
        readonly ydoc: Observable<YDocUpdateServerMsg | UpdateYDocClientMsg>;
        readonly comments: Observable<CommentsEventServerMsg>;
    };
    /**
     * Batches modifications made during the given function.
     * All the modifications are sent to other clients in a single message.
     * All the subscribers are called only after the batch is over.
     * All the modifications are merged in a single history item (undo/redo).
     *
     * @example
     * const { root } = await room.getStorage();
     * room.batch(() => {
     *   root.set("x", 0);
     *   room.updatePresence({ cursor: { x: 100, y: 100 }});
     * });
     */
    batch<T>(fn: () => T): T;
    /**
     * Get the storage status.
     *
     * - `not-loaded`: Initial state when entering the room.
     * - `loading`: Once the storage has been requested via room.getStorage().
     * - `synchronizing`: When some local updates have not been acknowledged by Liveblocks servers.
     * - `synchronized`: Storage is in sync with Liveblocks servers.
     */
    getStorageStatus(): StorageStatus;
    isPresenceReady(): boolean;
    isStorageReady(): boolean;
    /**
     * Returns a Promise that resolves as soon as Presence is available, which
     * happens shortly after the WebSocket connection has been established. Once
     * this happens, `self` and `others` are known and available to use. After
     * awaiting this promise, `.isPresenceReady()` will be guaranteed to be true.
     * Even when calling this function multiple times, it's guaranteed to return
     * the same Promise instance.
     */
    waitUntilPresenceReady(): Promise<void>;
    /**
     * Returns a Promise that resolves as soon as Storage has been loaded and
     * available. After awaiting this promise, `.isStorageReady()` will be
     * guaranteed to be true. Even when calling this function multiple times,
     * it's guaranteed to return the same Promise instance.
     */
    waitUntilStorageReady(): Promise<void>;
    /**
     * Start an attempt to connect the room (aka "enter" it). Calling
     * `.connect()` only has an effect if the room is still in its idle initial
     * state, or the room was explicitly disconnected, or reconnection attempts
     * were stopped (for example, because the user isn't authorized to enter the
     * room). Will be a no-op otherwise.
     */
    connect(): void;
    /**
     * Disconnect the room's connection to the Liveblocks server, if any. Puts
     * the room back into an idle state. It will not do anything until either
     * `.connect()` or `.reconnect()` is called.
     *
     * Only use this API if you wish to connect the room again at a later time.
     * If you want to disconnect the room because you no longer need it, call
     * `.destroy()` instead.
     */
    disconnect(): void;
    /**
     * Reconnect the room to the Liveblocks server by re-establishing a fresh
     * connection. If the room is not connected yet, initiate it.
     */
    reconnect(): void;
    /**
     * Gets the user's notification settings for the current room.
     *
     * @example
     * const settings = await room.getNotificationSettings();
     */
    getNotificationSettings(): Promise<RoomNotificationSettings>;
    /**
     * Updates the user's notification settings for the current room.
     *
     * @example
     * await room.updateNotificationSettings({ threads: "replies_and_mentions" });
     */
    updateNotificationSettings(settings: Partial<RoomNotificationSettings>): Promise<RoomNotificationSettings>;
    /**
     * Internal use only. Signature might change in the future.
     */
    markInboxNotificationAsRead(notificationId: string): Promise<void>;
} & CommentsApi<M>;
declare type Provider = {
    synced: boolean;
    getStatus: () => "loading" | "synchronizing" | "synchronized";
    on(event: "sync" | "status", listener: (synced: boolean) => void): void;
    off(event: "sync" | "status", listener: (synced: boolean) => void): void;
};
/**
 * @private
 *
 * Private methods to directly control the underlying state machine for this
 * room. Used in the core internals and for unit testing, but as a user of
 * Liveblocks, NEVER USE ANY OF THESE METHODS DIRECTLY, because bad things
 * will probably happen if you do.
 */
declare type PrivateRoomApi = {
    presenceBuffer: Json | undefined;
    undoStack: readonly (readonly Readonly<HistoryOp<JsonObject>>[])[];
    nodeCount: number;
    getProvider(): Provider | undefined;
    setProvider(provider: Provider | undefined): void;
    onProviderUpdate: Observable<void>;
    getSelf_forDevTools(): UserTreeNode | null;
    getOthers_forDevTools(): readonly UserTreeNode[];
    reportTextEditor(editor: "lexical", rootKey: string): void;
    createTextMention(userId: string, mentionId: string): Promise<Response>;
    deleteTextMention(mentionId: string): Promise<Response>;
    simulate: {
        explicitClose(event: IWebSocketCloseEvent): void;
        rawSend(data: string): void;
    };
};
declare type HistoryOp<P extends JsonObject> = Op | {
    readonly type: "presence";
    readonly data: P;
};
declare type Polyfills = {
    atob?: (data: string) => string;
    fetch?: typeof fetch;
    WebSocket?: IWebSocket;
};
/**
 * Makes all tuple positions optional.
 * Example, turns:
 *   [foo: string; bar: number]
 * into:
 *   [foo?: string; bar?: number]
 */
declare type OptionalTuple<T extends any[]> = {
    [K in keyof T]?: T[K];
};
/**
 * Returns Partial<T> if all fields on C are optional, T otherwise.
 */
declare type PartialUnless<C, T> = Record<string, never> extends C ? Partial<T> : [
    C
] extends [never] ? Partial<T> : T;
/**
 * Returns OptionalTupleUnless<T> if all fields on C are optional, T otherwise.
 */
declare type OptionalTupleUnless<C, T extends any[]> = Record<string, never> extends C ? OptionalTuple<T> : [
    C
] extends [never] ? OptionalTuple<T> : T;
declare class CommentsApiError extends Error {
    message: string;
    status: number;
    details?: JsonObject | undefined;
    constructor(message: string, status: number, details?: JsonObject | undefined);
}

declare type RenameDataField<T, TFieldName extends string> = T extends any ? {
    [K in keyof T as K extends "data" ? TFieldName : K]: T[K];
} : never;
declare type AsyncResult<T> = {
    readonly isLoading: true;
    readonly data?: never;
    readonly error?: never;
} | {
    readonly isLoading: false;
    readonly data: T;
    readonly error?: never;
} | {
    readonly isLoading: false;
    readonly data?: never;
    readonly error: Error;
};
declare type AsyncResultWithDataField<T, TDataField extends string> = RenameDataField<AsyncResult<T>, TDataField>;

declare type BatchStore<O, I> = Observable<void> & {
    get: (input: I) => Promise<void>;
    getState: (input: I) => AsyncResult<O> | undefined;
};

declare type Store<T> = {
    get: () => T;
    set: (callback: (currentState: T) => T) => void;
    subscribe: (callback: (state: T) => void) => () => void;
};

/**
 * Back-port of TypeScript 5.4's built-in NoInfer utility type.
 * See https://stackoverflow.com/a/56688073/148872
 */
declare type NoInfr<A> = [A][A extends any ? 0 : never];

declare type OptimisticUpdate<M extends BaseMetadata> = CreateThreadOptimisticUpdate<M> | DeleteThreadOptimisticUpdate | EditThreadMetadataOptimisticUpdate<M> | MarkThreadAsResolvedOptimisticUpdate | MarkThreadAsUnresolvedOptimisticUpdate | CreateCommentOptimisticUpdate | EditCommentOptimisticUpdate | DeleteCommentOptimisticUpdate | AddReactionOptimisticUpdate | RemoveReactionOptimisticUpdate | MarkInboxNotificationAsReadOptimisticUpdate | MarkAllInboxNotificationsAsReadOptimisticUpdate | DeleteInboxNotificationOptimisticUpdate | DeleteAllInboxNotificationsOptimisticUpdate | UpdateNotificationSettingsOptimisticUpdate;
declare type CreateThreadOptimisticUpdate<M extends BaseMetadata> = {
    type: "create-thread";
    id: string;
    roomId: string;
    thread: ThreadData<M>;
};
declare type DeleteThreadOptimisticUpdate = {
    type: "delete-thread";
    id: string;
    roomId: string;
    threadId: string;
    deletedAt: Date;
};
declare type EditThreadMetadataOptimisticUpdate<M extends BaseMetadata> = {
    type: "edit-thread-metadata";
    id: string;
    threadId: string;
    metadata: Resolve<Patchable<M>>;
    updatedAt: Date;
};
declare type MarkThreadAsResolvedOptimisticUpdate = {
    type: "mark-thread-as-resolved";
    id: string;
    threadId: string;
    updatedAt: Date;
};
declare type MarkThreadAsUnresolvedOptimisticUpdate = {
    type: "mark-thread-as-unresolved";
    id: string;
    threadId: string;
    updatedAt: Date;
};
declare type CreateCommentOptimisticUpdate = {
    type: "create-comment";
    id: string;
    comment: CommentData;
};
declare type EditCommentOptimisticUpdate = {
    type: "edit-comment";
    id: string;
    comment: CommentData;
};
declare type DeleteCommentOptimisticUpdate = {
    type: "delete-comment";
    id: string;
    roomId: string;
    threadId: string;
    deletedAt: Date;
    commentId: string;
};
declare type AddReactionOptimisticUpdate = {
    type: "add-reaction";
    id: string;
    threadId: string;
    commentId: string;
    reaction: CommentUserReaction;
};
declare type RemoveReactionOptimisticUpdate = {
    type: "remove-reaction";
    id: string;
    threadId: string;
    commentId: string;
    emoji: string;
    userId: string;
    removedAt: Date;
};
declare type MarkInboxNotificationAsReadOptimisticUpdate = {
    type: "mark-inbox-notification-as-read";
    id: string;
    inboxNotificationId: string;
    readAt: Date;
};
declare type MarkAllInboxNotificationsAsReadOptimisticUpdate = {
    type: "mark-all-inbox-notifications-as-read";
    id: string;
    readAt: Date;
};
declare type DeleteInboxNotificationOptimisticUpdate = {
    type: "delete-inbox-notification";
    id: string;
    inboxNotificationId: string;
    deletedAt: Date;
};
declare type DeleteAllInboxNotificationsOptimisticUpdate = {
    type: "delete-all-inbox-notifications";
    id: string;
    deletedAt: Date;
};
declare type UpdateNotificationSettingsOptimisticUpdate = {
    type: "update-notification-settings";
    id: string;
    roomId: string;
    settings: Partial<RoomNotificationSettings>;
};
declare type QueryState = AsyncResult<undefined>;
declare type CacheState<M extends BaseMetadata> = {
    /**
     * Threads by ID.
     */
    threads: Record<string, ThreadDataWithDeleteInfo<M>>;
    /**
     * Keep track of loading and error status of all the queries made by the client.
     */
    queries: Record<string, QueryState>;
    /**
     * Optimistic updates that have not been acknowledged by the server yet.
     * They are applied on top of the threads in selectors.
     */
    optimisticUpdates: OptimisticUpdate<M>[];
    /**
     * Inbox notifications by ID.
     */
    inboxNotifications: Record<string, InboxNotificationData>;
    /**
     * Notification settings per room id
     */
    notificationSettings: Record<string, RoomNotificationSettings>;
};
interface CacheStore<M extends BaseMetadata> extends Store<CacheState<M>> {
    deleteThread(threadId: string): void;
    updateThreadAndNotification(thread: ThreadData<M>, inboxNotification?: InboxNotificationData): void;
    updateThreadsAndNotifications(threads: ThreadData<M>[], inboxNotifications: InboxNotificationData[], deletedThreads: ThreadDeleteInfo[], deletedInboxNotifications: InboxNotificationDeleteInfo[], queryKey?: string): void;
    updateRoomInboxNotificationSettings(roomId: string, settings: RoomNotificationSettings, queryKey: string): void;
    pushOptimisticUpdate(optimisticUpdate: OptimisticUpdate<M>): void;
    setQueryState(queryKey: string, queryState: QueryState): void;
    optimisticUpdatesEventSource: ReturnType<typeof makeEventSource<OptimisticUpdate<M>>>;
}
declare function applyOptimisticUpdates<M extends BaseMetadata>(state: CacheState<M>): Pick<CacheState<M>, "threads" | "inboxNotifications" | "notificationSettings">;
declare function upsertComment<M extends BaseMetadata>(thread: ThreadDataWithDeleteInfo<M>, comment: CommentData): ThreadDataWithDeleteInfo<M>;
declare function deleteComment<M extends BaseMetadata>(thread: ThreadDataWithDeleteInfo<M>, commentId: string, deletedAt: Date): ThreadDataWithDeleteInfo<M>;
declare function addReaction<M extends BaseMetadata>(thread: ThreadDataWithDeleteInfo<M>, commentId: string, reaction: CommentUserReaction): ThreadDataWithDeleteInfo<M>;
declare function removeReaction<M extends BaseMetadata>(thread: ThreadDataWithDeleteInfo<M>, commentId: string, emoji: string, userId: string, removedAt: Date): ThreadDataWithDeleteInfo<M>;

declare type OptionalPromise<T> = T | Promise<T>;

declare type ResolveMentionSuggestionsArgs = {
    /**
     * The ID of the current room.
     */
    roomId: string;
    /**
     * The text to search for.
     */
    text: string;
};
declare type ResolveUsersArgs = {
    /**
     * The IDs of the users to resolve.
     */
    userIds: string[];
};
declare type ResolveRoomsInfoArgs = {
    /**
     * The IDs of the rooms to resolve.
     */
    roomIds: string[];
};
declare type EnterOptions<P extends JsonObject = DP, S extends LsonObject = DS> = Resolve<{
    /**
     * Whether or not the room automatically connects to Liveblock servers.
     * Default is true.
     *
     * Usually set to false when the client is used from the server to not call
     * the authentication endpoint or connect via WebSocket.
     */
    autoConnect?: boolean;
    /**
     * Only necessary when you’re using Liveblocks with React v17 or lower.
     *
     * If so, pass in a reference to `ReactDOM.unstable_batchedUpdates` here.
     * This will allow Liveblocks to circumvent the so-called "zombie child
     * problem". To learn more, see
     * https://liveblocks.io/docs/guides/troubleshooting#stale-props-zombie-child
     */
    unstable_batchedUpdates?: (cb: () => void) => void;
} & PartialUnless<P, {
    /**
     * The initial Presence to use and announce when you enter the Room. The
     * Presence is available on all users in the Room (me & others).
     */
    initialPresence: P | ((roomId: string) => P);
}> & PartialUnless<S, {
    /**
     * The initial Storage to use when entering a new Room.
     */
    initialStorage: S | ((roomId: string) => S);
}>>;
/**
 * @private
 *
 * Private methods and variables used in the core internals, but as a user
 * of Liveblocks, NEVER USE ANY OF THESE DIRECTLY, because bad things
 * will probably happen if you do.
 */
declare type PrivateClientApi<U extends BaseUserMeta, M extends BaseMetadata> = {
    readonly currentUserIdStore: Store<string | null>;
    readonly resolveMentionSuggestions: ClientOptions<U>["resolveMentionSuggestions"];
    readonly cacheStore: CacheStore<BaseMetadata>;
    readonly usersStore: BatchStore<U["info"] | undefined, string>;
    readonly roomsInfoStore: BatchStore<DRI | undefined, string>;
    readonly getRoomIds: () => string[];
    readonly getThreads: () => Promise<{
        threads: ThreadData<M>[];
        inboxNotifications: InboxNotificationData[];
        requestedAt: Date;
    }>;
    readonly getThreadsSince: (options: {
        since: Date;
    }) => Promise<{
        inboxNotifications: {
            updated: InboxNotificationData[];
            deleted: InboxNotificationDeleteInfo[];
        };
        threads: {
            updated: ThreadData<M>[];
            deleted: ThreadDeleteInfo[];
        };
        requestedAt: Date;
    }>;
};
declare type NotificationsApi<M extends BaseMetadata> = {
    /**
     * Gets the current user inbox notifications and their associated threads.
     * It also returns the request date that can be used for subsequent polling.
     *
     * @example
     * const {
     *   inboxNotifications,
     *   threads,
     *   requestedAt
     * } = await client.getInboxNotifications();
     */
    getInboxNotifications(): Promise<{
        inboxNotifications: InboxNotificationData[];
        threads: ThreadData<M>[];
        requestedAt: Date;
    }>;
    /**
     * Gets the updated and deleted inbox notifications and their associated threads since the requested date.
     *
     * @example
     * const result = await client.getInboxNotifications();
     * // ... //
     * await client.getInboxNotificationsSince({ since: result.requestedAt }});
     */
    getInboxNotificationsSince(options: {
        since: Date;
    }): Promise<{
        inboxNotifications: {
            updated: InboxNotificationData[];
            deleted: InboxNotificationDeleteInfo[];
        };
        threads: {
            updated: ThreadData<M>[];
            deleted: ThreadDeleteInfo[];
        };
        requestedAt: Date;
    }>;
    /**
     * Gets the number of unread inbox notifications for the current user.
     *
     * @example
     * const count = await client.getUnreadInboxNotificationsCount();
     */
    getUnreadInboxNotificationsCount(): Promise<number>;
    /**
     * Marks all inbox notifications as read.
     *
     * @example
     * await client.markAllInboxNotificationsAsRead();
     */
    markAllInboxNotificationsAsRead(): Promise<void>;
    /**
     * Marks an inbox notification as read.
     *
     * @example
     * await client.markInboxNotificationAsRead("in_xxx");
     */
    markInboxNotificationAsRead(inboxNotificationId: string): Promise<void>;
    /**
     * Deletes all inbox notifications for the current user.
     *
     * @example
     * await client.deleteAllInboxNotifications();
     */
    deleteAllInboxNotifications(): Promise<void>;
    /**
     * Deletes an inbox notification for the current user.
     *
     * @example
     * await client.deleteInboxNotification("in_xxx");
     */
    deleteInboxNotification(inboxNotificationId: string): Promise<void>;
};
/**
 * @private Widest-possible Client type, matching _any_ Client instance. Note
 * that this type is different from `Client`-without-type-arguments. That
 * represents a Client instance using globally augmented types only, which is
 * narrower.
 */
declare type OpaqueClient = Client<BaseUserMeta>;
declare type Client<U extends BaseUserMeta = DU, M extends BaseMetadata = DM> = {
    /**
     * Gets a room. Returns null if {@link Client.enter} has not been called previously.
     *
     * @param roomId The id of the room
     */
    getRoom<P extends JsonObject = DP, S extends LsonObject = DS, E extends Json = DE, M extends BaseMetadata = DM>(roomId: string): Room<P, S, U, E, M> | null;
    /**
     * Enter a room.
     * @param roomId The id of the room
     * @param options Optional. You can provide initializers for the Presence or Storage when entering the Room.
     * @returns The room and a leave function. Call the returned leave() function when you no longer need the room.
     */
    enterRoom<P extends JsonObject = DP, S extends LsonObject = DS, E extends Json = DE, M extends BaseMetadata = DM>(roomId: string, ...args: OptionalTupleUnless<P & S, [
        options: EnterOptions<NoInfr<P>, NoInfr<S>>
    ]>): {
        room: Room<P, S, U, E, M>;
        leave: () => void;
    };
    /**
     * Purges all cached auth tokens and reconnects all rooms that are still
     * connected, if any.
     *
     * Call this whenever you log out a user in your application.
     */
    logout(): void;
    /**
     * @private
     *
     * Private methods and variables used in the core internals, but as a user
     * of Liveblocks, NEVER USE ANY OF THESE DIRECTLY, because bad things
     * will probably happen if you do.
     */
    readonly [kInternal]: PrivateClientApi<U, M>;
} & NotificationsApi<M>;
declare type AuthEndpoint = string | ((room?: string) => Promise<CustomAuthenticationResult>);
/**
 * The authentication endpoint that is called to ensure that the current user has access to a room.
 * Can be an url or a callback if you need to add additional headers.
 */
declare type ClientOptions<U extends BaseUserMeta = DU> = {
    throttle?: number;
    lostConnectionTimeout?: number;
    backgroundKeepAliveTimeout?: number;
    polyfills?: Polyfills;
    unstable_fallbackToHTTP?: boolean;
    unstable_streamData?: boolean;
    /**
     * A function that returns a list of user IDs matching a string.
     */
    resolveMentionSuggestions?: (args: ResolveMentionSuggestionsArgs) => OptionalPromise<string[]>;
    /**
     * A function that returns user info from user IDs.
     */
    resolveUsers?: (args: ResolveUsersArgs) => OptionalPromise<(U["info"] | undefined)[] | undefined>;
    /**
     * A function that returns room info from room IDs.
     */
    resolveRoomsInfo?: (args: ResolveRoomsInfoArgs) => OptionalPromise<(DRI | undefined)[] | undefined>;
} & ({
    publicApiKey: string;
    authEndpoint?: never;
} | {
    publicApiKey?: never;
    authEndpoint: AuthEndpoint;
});
/**
 * Create a client that will be responsible to communicate with liveblocks servers.
 *
 * @example
 * const client = createClient({
 *   authEndpoint: "/api/auth"
 * });
 *
 * // It's also possible to use a function to call your authentication endpoint.
 * // Useful to add additional headers or use an API wrapper (like Firebase functions)
 * const client = createClient({
 *   authEndpoint: async (room?) => {
 *     const response = await fetch("/api/auth", {
 *       method: "POST",
 *       headers: {
 *          Authentication: "token",
 *          "Content-Type": "application/json"
 *       },
 *       body: JSON.stringify({ room })
 *     });
 *
 *     return await response.json(); // should be: { token: "..." }
 *   }
 * });
 */
declare function createClient<U extends BaseUserMeta = DU>(options: ClientOptions<U>): Client<U>;
declare class NotificationsApiError extends Error {
    message: string;
    status: number;
    details?: JsonObject | undefined;
    constructor(message: string, status: number, details?: JsonObject | undefined);
}

declare type CommentBodyParagraphElementArgs = {
    /**
     * The paragraph element.
     */
    element: CommentBodyParagraph;
    /**
     * The text content of the paragraph.
     */
    children: string;
};
declare type CommentBodyTextElementArgs = {
    /**
     * The text element.
     */
    element: CommentBodyText;
};
declare type CommentBodyLinkElementArgs = {
    /**
     * The link element.
     */
    element: CommentBodyLink;
    /**
     * The absolute URL of the link.
     */
    href: string;
};
declare type CommentBodyMentionElementArgs<U extends BaseUserMeta = DU> = {
    /**
     * The mention element.
     */
    element: CommentBodyMention;
    /**
     * The mention's user info, if the `resolvedUsers` option was provided.
     */
    user?: U["info"];
};
declare type StringifyCommentBodyElements<U extends BaseUserMeta = DU> = {
    /**
     * The element used to display paragraphs.
     */
    paragraph: (args: CommentBodyParagraphElementArgs, index: number) => string;
    /**
     * The element used to display text elements.
     */
    text: (args: CommentBodyTextElementArgs, index: number) => string;
    /**
     * The element used to display links.
     */
    link: (args: CommentBodyLinkElementArgs, index: number) => string;
    /**
     * The element used to display mentions.
     */
    mention: (args: CommentBodyMentionElementArgs<U>, index: number) => string;
};
declare type StringifyCommentBodyOptions<U extends BaseUserMeta = DU> = {
    /**
     * Which format to convert the comment to.
     */
    format?: "plain" | "html" | "markdown";
    /**
     * The elements used to customize the resulting string. Each element has
     * priority over the defaults inherited from the `format` option.
     */
    elements?: Partial<StringifyCommentBodyElements<U>>;
    /**
     * The separator used between paragraphs.
     */
    separator?: string;
    /**
     * A function that returns user info from user IDs.
     */
    resolveUsers?: (args: ResolveUsersArgs) => OptionalPromise<(U["info"] | undefined)[] | undefined>;
};
/**
 * Get an array of each user's ID that has been mentioned in a `CommentBody`.
 */
declare function getMentionedIdsFromCommentBody(body: CommentBody): string[];
/**
 * Convert a `CommentBody` into either a plain string,
 * Markdown, HTML, or a custom format.
 */
declare function stringifyCommentBody(body: CommentBody, options?: StringifyCommentBodyOptions<BaseUserMeta>): Promise<string>;

/**
 * Converts a plain comment data object (usually returned by the API) to a comment data object that can be used by the client.
 * This is necessary because the plain data object stores dates as ISO strings, but the client expects them as Date objects.
 * @param data The plain comment data object (usually returned by the API)
 * @returns The rich comment data object that can be used by the client.
 */
declare function convertToCommentData(data: CommentDataPlain): CommentData;
/**
 * Converts a plain thread data object (usually returned by the API) to a thread data object that can be used by the client.
 * This is necessary because the plain data object stores dates as ISO strings, but the client expects them as Date objects.
 * @param data The plain thread data object (usually returned by the API)
 * @returns The rich thread data object that can be used by the client.
 */
declare function convertToThreadData<M extends BaseMetadata>(data: ThreadDataPlain<M>): ThreadData<M>;
/**
 * Converts a plain comment reaction object (usually returned by the API) to a comment reaction object that can be used by the client.
 * This is necessary because the plain data object stores dates as ISO strings, but the client expects them as Date objects.
 * @param data The plain comment reaction object (usually returned by the API)
 * @returns The rich comment reaction object that can be used by the client.
 */
declare function convertToCommentUserReaction(data: CommentUserReactionPlain): CommentUserReaction;
/**
 * Converts a plain inbox notification data object (usually returned by the API) to an inbox notification data object that can be used by the client.
 * This is necessary because the plain data object stores dates as ISO strings, but the client expects them as Date objects.
 * @param data The plain inbox notification data object (usually returned by the API)
 * @returns The rich inbox notification data object that can be used by the client.
 */
declare function convertToInboxNotificationData(data: InboxNotificationDataPlain): InboxNotificationData;

/**
 * Lookup table for nodes (= SerializedCrdt values) by their IDs.
 */
declare type NodeMap = Map<string, // Node ID
SerializedCrdt>;
/**
 * Reverse lookup table for all child nodes (= list of SerializedCrdt values)
 * by their parent node's IDs.
 */
declare type ParentToChildNodeMap = Map<string, // Parent's node ID
IdTuple<SerializedChild>[]>;

declare function isLiveNode(value: unknown): value is LiveNode;
declare function cloneLson<L extends Lson | undefined>(value: L): L;

declare function lsonToJson(value: Lson): Json;
declare function patchLiveObjectKey<O extends LsonObject, K extends keyof O, V extends Json>(liveObject: LiveObject<O>, key: K, prev?: V, next?: V): void;
declare function legacy_patchImmutableObject<TState extends JsonObject>(state: TState, updates: StorageUpdate[]): TState;

/**
 * Helper function that can be used to implement exhaustive switch statements
 * with TypeScript. Example usage:
 *
 *    type Fruit = "🍎" | "🍌";
 *
 *    switch (fruit) {
 *      case "🍎":
 *      case "🍌":
 *        return doSomething();
 *
 *      default:
 *        return assertNever(fruit, "Unknown fruit");
 *    }
 *
 * If now the Fruit union is extended (i.e. add "🍒"), TypeScript will catch
 * this *statically*, rather than at runtime, and force you to handle the
 * 🍒 case.
 */
declare function assertNever(_value: never, errmsg: string): never;
/**
 * Asserts that a certain condition holds. If it does not hold, will throw
 * a runtime error in dev mode.
 *
 * In production, nothing is asserted and this acts as a no-op.
 */
declare function assert(condition: boolean, errmsg: string): asserts condition;
/**
 * Asserts that a given value is non-nullable. This is similar to TypeScript's
 * `!` operator, but will throw an error at runtime (dev-mode only) indicating
 * an incorrect assumption.
 *
 * Instead of:
 *
 *     foo!.bar
 *
 * Use:
 *
 *     nn(foo).bar
 *
 */
declare function nn<T>(value: T, errmsg?: string): NonNullable<T>;

declare function createThreadId(): string;
declare function createCommentId(): string;
declare function createInboxNotificationId(): string;

/**
 * Displays a deprecation warning in the dev console. Only in dev mode, and
 * only once per message/key. In production, this is a no-op.
 */
declare function deprecate(message: string, key?: string): void;
/**
 * Conditionally displays a deprecation warning in the dev
 * console if the first argument is truthy. Only in dev mode, and
 * only once per message/key. In production, this is a no-op.
 */
declare function deprecateIf(condition: unknown, message: string, key?: string): void;
/**
 * Throws a deprecation error in the dev console.
 *
 * Only triggers in dev mode. In production, this is a no-op.
 */
declare function throwUsageError(message: string): void;
/**
 * Conditionally throws a usage error in the dev console if the first argument
 * is truthy. Use this to "escalate" usage patterns that in previous versions
 * we already warned about with deprecation warnings.
 *
 * Only has effect in dev mode. In production, this is a no-op.
 */
declare function errorIf(condition: unknown, message: string): void;

declare const warn: (message: string, ...args: readonly unknown[]) => void;
declare const error: (message: string, ...args: readonly unknown[]) => void;
declare const warnWithTitle: (title: string, message: string, ...args: readonly unknown[]) => void;
declare const errorWithTitle: (title: string, message: string, ...args: readonly unknown[]) => void;

declare const fancyConsole_error: typeof error;
declare const fancyConsole_errorWithTitle: typeof errorWithTitle;
declare const fancyConsole_warn: typeof warn;
declare const fancyConsole_warnWithTitle: typeof warnWithTitle;
declare namespace fancyConsole {
  export { fancyConsole_error as error, fancyConsole_errorWithTitle as errorWithTitle, fancyConsole_warn as warn, fancyConsole_warnWithTitle as warnWithTitle };
}

/**
 * Freezes the given argument, but only in development builds. In production
 * builds, this is a no-op for performance reasons.
 */
declare const freeze: typeof Object.freeze;

declare const nanoid: (t?: number) => string;

/**
 * Converts an object to a query string
 * Example:
 * ```ts
 * const query = objectToQuery({
      resolved: true,
      metadata: {
        status: "open",
        priority: 3,
        org: {
          startsWith: "liveblocks:",
        },
      },
});

console.log(query);
// resolved:true AND metadata["status"]:open AND metadata["priority"]:3 AND metadata["org"]^"liveblocks:"

 * ```
 *
 *
 */
declare type SimpleFilterValue = string | number | boolean;
declare type OperatorFilterValue = {
    startsWith: string;
};
declare type FilterValue = SimpleFilterValue | OperatorFilterValue;
declare function objectToQuery(obj: {
    [key: string]: FilterValue | {
        [key: string]: FilterValue | undefined;
    } | undefined;
}): string;

declare type Poller = {
    start(interval: number): void;
    restart(interval: number): void;
    pause(): void;
    resume(): void;
    stop(): void;
};
declare function makePoller(callback: () => Promise<void> | void): Poller;

declare const brand: unique symbol;
declare type Brand<T, TBrand extends string> = T & {
    [brand]: TBrand;
};
/**
 * Throw an error, but as an expression instead of a statement.
 */
declare function raise(msg: string): never;
declare function isPlainObject(blob: unknown): blob is {
    [key: string]: unknown;
};
/**
 * Alternative to JSON.parse() that will not throw in production. If the passed
 * string cannot be parsed, this will return `undefined`.
 */
declare function tryParseJson(rawMessage: string): Json | undefined;
/**
 * Decode base64 string.
 */
declare function b64decode(b64value: string): string;
/**
 * Returns a promise that resolves after the given number of milliseconds.
 */
declare function wait(millis: number): Promise<void>;
/**
 * Returns whatever the given promise returns, but will be rejected with
 * a "Timed out" error if the given promise does not return or reject within
 * the given timeout period (in milliseconds).
 */
declare function withTimeout<T>(promise: Promise<T>, millis: number, errmsg: string): Promise<T>;
/**
 * Memoize a promise factory, so that each subsequent call will return the same
 * pending or success promise. If the promise rejects, will retain that failed
 * promise for a small time period, after which the next attempt will reset the
 * memoized value.
 */
declare function memoizeOnSuccess<T>(factoryFn: () => Promise<T>): () => Promise<T>;

/**
 * Positions, aka the Pos type, are efficient encodings of "positions" in
 * a list, using the following printable subset of the ASCII alphabet:
 *
 *    !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~
 *   ^                                                                                             ^
 *   Lowest digit                                                                      Highest digit
 *
 * Each Pos is a sequence of characters from the above alphabet, conceptually
 * codifying a floating point number 0 < n < 1. For example, the string "31007"
 * would be used to represent the number 0.31007, except that this
 * representation uses base 96.
 *
 *   0 ≃ ' '  (lowest digit)
 *   1 ≃ '!'
 *   2 ≃ '"'
 *   ...
 *   9 ≃ '~'  (highest digit)
 *
 * So think:
 *   '!'    ≃ 0.1
 *   '"'    ≃ 0.2
 *   '!"~'  ≃ 0.129
 *
 * Three rules:
 * - All "characters" in the string should be valid digits (from the above
 *   alphabet)
 * - The value 0.0 is not a valid Pos value
 * - A Pos cannot have trailing "zeroes"
 *
 * This representation has the following benefits:
 *
 * 1. It's always possible to get a number that lies before, after, or between
 *    two arbitrary Pos values.
 * 2. Pos values can be compared using normal string comparison.
 *
 * Some examples:
 * - '!'  < '"'   (like how .1  < .2)
 * - '!'  < '~'   (like how .1  < .9)
 * - '!!' < '!~'  (like how .11 < .19)
 * - '~!' < '~~'  (like how .91 < .99)
 * - '~'  < '~!'  (like how .9  < .91)
 * - '!!' < '!O'  (like how .1  < .5)
 * - '!O' < '!~'  (like how .5  < .9)
 *
 */

/**
 * A valid/verified "position" string. These values are used as "parentKey"s by
 * LiveList children, and define their relative ordering.
 */
declare type Pos = Brand<string, "Pos">;
/**
 * Given two positions, returns the position value that lies in the middle.
 * When given only a high bound, computes the canonical position "before" it.
 * When given only a low bound, computes the canonical position "after" it.
 * When given no bounds at all, returns the "first" canonical position.
 */
declare function makePosition(x?: Pos, y?: Pos): Pos;
/**
 * Checks that a str is a valid Pos, and converts it to the nearest valid one
 * if not.
 */
declare function asPos(str: string): Pos;

/**
 * Shallowly compares two given values.
 *
 * - Two simple values are considered equal if they're strictly equal
 * - Two arrays are considered equal if their members are strictly equal
 * - Two objects are considered equal if their values are strictly equal
 *
 * Testing goes one level deep.
 */
declare function shallow(a: unknown, b: unknown): boolean;

declare type OmitFirstTupleElement<T extends any[]> = T extends [any, ...infer R] ? R : never;
declare function stringify(object: Parameters<typeof JSON.stringify>[0], ...args: OmitFirstTupleElement<Parameters<typeof JSON.stringify>>): string;

/**
 * Definition of all messages the Panel can send to the Client.
 */
declare type PanelToClientMessage = 
/**
 * Initial message from the panel to the client, used for two purposes.
 * 1. First, it’s eavesdropped by the background script, which uses this
 *    message to register a "port", which sets up a channel for two-way
 *    communication between panel and client for the remainder of the time.
 * 2. It signifies to the client that the devpanel is listening.
 */
{
    msg: "connect";
}
/**
 * Expresses to the client that the devtool is interested in
 * receiving the "sync stream" for the room. The sync stream
 * that follows is an initial "full sync", followed by many
 * "partial" syncs, happening for every update.
 */
 | {
    msg: "room::subscribe";
    roomId: string;
}
/**
 * Expresses to the client that the devtool no longer is
 * interested in the "sync stream" for a room, for example,
 * because the devtools panel is closed, or if it switched to
 * a different room.
 */
 | {
    msg: "room::unsubscribe";
    roomId: string;
};
/**
 * Definition of all messages the Client can send to the Panel.
 */
declare type ClientToPanelMessage = 
/**
 * Initial message sent by the client to test if a dev panel is listening.
 * This is necessary in cases where the dev panel is already opened and
 * listened, before the client is loaded. If the panel receives this message,
 * it will replay its initial "connect" message, which triggers the loading
 * of the two-way connection.
 */
{
    msg: "wake-up-devtools";
}
/**
 * Sent when a new room is available for the dev panel to track and watch.
 * Sent by the client as soon as the room is attempted to be entered. This
 * happens _before_ the actual connection to the room server is established,
 * meaning the room is visible to the devtools even while it is connecting.
 */
 | {
    msg: "room::available";
    roomId: string;
    clientVersion: string;
}
/**
 * Sent when a room is left and the client loses track of the room instance.
 */
 | {
    msg: "room::unavailable";
    roomId: string;
}
/**
 * Sent initially, to synchronize the entire current state of the room.
 */
 | {
    msg: "room::sync::full";
    roomId: string;
    status: Status;
    storage: readonly LsonTreeNode[] | null;
    me: UserTreeNode | null;
    others: readonly UserTreeNode[];
}
/**
 * Sent whenever something about the internals of a room changes.
 */
 | {
    msg: "room::sync::partial";
    roomId: string;
    status?: Status;
    storage?: readonly LsonTreeNode[];
    me?: UserTreeNode;
    others?: readonly UserTreeNode[];
}
/**
 * Sent whenever an user room event is emitted in the room.
 */
 | {
    msg: "room::events::custom-event";
    roomId: string;
    event: CustomEventTreeNode;
}
/**
 * Sent whenever the ydoc is updated
 */
 | {
    msg: "room::sync::ydoc";
    roomId: string;
    update: YDocUpdateServerMsg | UpdateYDocClientMsg;
};
declare type FullPanelToClientMessage = PanelToClientMessage & {
    source: "liveblocks-devtools-panel";
    tabId: number;
};
declare type FullClientToPanelMessage = ClientToPanelMessage & {
    source: "liveblocks-devtools-client";
};

type protocol_ClientToPanelMessage = ClientToPanelMessage;
type protocol_FullClientToPanelMessage = FullClientToPanelMessage;
type protocol_FullPanelToClientMessage = FullPanelToClientMessage;
type protocol_PanelToClientMessage = PanelToClientMessage;
declare namespace protocol {
  export type { protocol_ClientToPanelMessage as ClientToPanelMessage, protocol_FullClientToPanelMessage as FullClientToPanelMessage, protocol_FullPanelToClientMessage as FullPanelToClientMessage, protocol_PanelToClientMessage as PanelToClientMessage };
}

/**
 * Helper type to help users adopt to Lson types from interface definitions.
 * You should only use this to wrap interfaces you don't control. For more
 * information, see
 * https://liveblocks.io/docs/guides/limits#lson-constraint-and-interfaces
 */
declare type EnsureJson<T> = T extends Json ? T : T extends Array<infer I> ? (EnsureJson<I>)[] : [
    unknown
] extends [T] ? Json | undefined : T extends Date ? string : T extends (...args: any[]) => any ? never : {
    [K in keyof T as EnsureJson<T[K]> extends never ? never : K]: EnsureJson<T[K]>;
};

export { type AckOp, type ActivityData, type AsyncResult, type AsyncResultWithDataField, type BaseActivitiesData, type BaseAuthResult, type BaseMetadata, type BaseRoomInfo, type BaseUserMeta, type Brand, type BroadcastEventClientMsg, type BroadcastOptions, type BroadcastedEventServerMsg, type CacheState, type CacheStore, type Client, type ClientMsg, ClientMsgCode, type ClientOptions, type CommentBody, type CommentBodyBlockElement, type CommentBodyElement, type CommentBodyInlineElement, type CommentBodyLink, type CommentBodyLinkElementArgs, type CommentBodyMention, type CommentBodyMentionElementArgs, type CommentBodyParagraph, type CommentBodyParagraphElementArgs, type CommentBodyText, type CommentBodyTextElementArgs, type CommentData, type CommentDataPlain, type CommentReaction, type CommentUserReaction, type CommentUserReactionPlain, CommentsApiError, type CommentsEventServerMsg, CrdtType, type CreateListOp, type CreateMapOp, type CreateObjectOp, type CreateOp, type CreateRegisterOp, type CustomAuthenticationResult, type DAD, type DE, type DM, type DP, type DRI, type DS, type DU, type Delegates, type DeleteCrdtOp, type DeleteObjectKeyOp, DevToolsTreeNode as DevTools, protocol as DevToolsMsg, type EnsureJson, type EnterOptions, type EventSource, type FetchStorageClientMsg, type FetchYDocClientMsg, type GetThreadsOptions, type History, type IUserInfo, type IWebSocket, type IWebSocketCloseEvent, type IWebSocketEvent, type IWebSocketInstance, type IWebSocketMessageEvent, type IdTuple, type Immutable, type InboxNotificationCustomData, type InboxNotificationCustomDataPlain, type InboxNotificationData, type InboxNotificationDataPlain, type InboxNotificationDeleteInfo, type InboxNotificationTextMentionData, type InboxNotificationTextMentionDataPlain, type InboxNotificationThreadData, type InboxNotificationThreadDataPlain, type InitialDocumentStateServerMsg, type Json, type JsonArray, type JsonObject, type JsonScalar, type KDAD, LiveList, type LiveListUpdate, LiveMap, type LiveMapUpdate, type LiveNode, LiveObject, type LiveObjectUpdate, type LiveStructure, LiveblocksError, type LostConnectionEvent, type Lson, type LsonObject, type NoInfr, type NodeMap, NotificationsApiError, type Op, OpCode, type OpaqueClient, type OpaqueRoom, type OptionalPromise, type OptionalTupleUnless, type OthersEvent, type ParentToChildNodeMap, type PartialUnless, type Patchable, type PlainLson, type PlainLsonFields, type PlainLsonList, type PlainLsonMap, type PlainLsonObject, type PrivateClientApi, type PrivateRoomApi, type QueryMetadata, type RejectedStorageOpServerMsg, type Resolve, type ResolveMentionSuggestionsArgs, type ResolveRoomsInfoArgs, type ResolveUsersArgs, type Room, type RoomEventMessage, type RoomNotificationSettings, type RoomStateServerMsg, type SerializedChild, type SerializedCrdt, type SerializedList, type SerializedMap, type SerializedObject, type SerializedRegister, type SerializedRootObject, type ServerMsg, ServerMsgCode, type SetParentKeyOp, type Status, type StorageStatus, type StorageUpdate, type Store, type StringifyCommentBodyElements, type StringifyCommentBodyOptions, type ThreadData, type ThreadDataPlain, type ThreadDeleteInfo, type ToImmutable, type ToJson, type UnsubscribeCallback, type UpdateObjectOp, type UpdatePresenceClientMsg, type UpdatePresenceServerMsg, type UpdateStorageClientMsg, type UpdateStorageServerMsg, type UpdateYDocClientMsg, type User, type UserJoinServerMsg, type UserLeftServerMsg, WebsocketCloseCodes, type YDocUpdateServerMsg, ackOp, addReaction, applyOptimisticUpdates, asPos, assert, assertNever, b64decode, cloneLson, fancyConsole as console, convertToCommentData, convertToCommentUserReaction, convertToInboxNotificationData, convertToThreadData, createClient, createCommentId, createInboxNotificationId, createThreadId, deleteComment, deprecate, deprecateIf, detectDupes, errorIf, freeze, getMentionedIdsFromCommentBody, isChildCrdt, isJsonArray, isJsonObject, isJsonScalar, isLiveNode, isPlainObject, isRootCrdt, kInternal, legacy_patchImmutableObject, lsonToJson, makeEventSource, makePoller, makePosition, memoizeOnSuccess, nanoid, nn, objectToQuery, patchLiveObjectKey, raise, removeReaction, shallow, stringify, stringifyCommentBody, throwUsageError, toPlainLson, tryParseJson, upsertComment, wait, withTimeout };
