import { nn } from "../lib/assert";
import { nanoid } from "../lib/nanoid";
import type { CreateAsyncRegisterOp, CreateOp, Op } from "../protocol/Op";
import { OpCode } from "../protocol/Op";
import type {
  IdTuple,
  SerializedAsyncRegister,
} from "../protocol/SerializedCrdt";
import { CrdtType } from "../protocol/SerializedCrdt";
import type * as DevTools from "../types/DevToolsTreeNode";
import type { ParentToChildNodeMap } from "../types/NodeMap";
import type { ApplyResult, ManagedPool } from "./AbstractCrdt";
import { AbstractCrdt } from "./AbstractCrdt";
import {
  isLiveNode,
  isLiveStructure,
  lsonToLiveNode,
} from "./liveblocks-helpers";
import type { LiveObject } from "./LiveObject";
import type { LiveNode, Lson, LsonObject } from "./Lson";
import type { ToImmutable } from "./utils";

export type LiveAsyncRegisterDelta =
  | { type: "loaded" }
  | { type: "set" }
  | { type: "clear" };

/**
 * A LiveList notification that is sent in-client to any subscribers whenever
 * one or more of the items inside the LiveList instance have changed.
 */
export type LiveAsyncRegisterUpdates<TItem extends LiveObject<LsonObject>> = {
  type: "LiveAsyncRegister";
  node: LiveAsyncRegister<TItem>;
  updates: LiveAsyncRegisterDelta[];
};

/**
 * The LiveObject class is similar to a JavaScript object that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
export class LiveAsyncRegister<
  TValue extends LiveObject<LsonObject>,
> extends AbstractCrdt {
  #data: Lson | null = null;

  asyncType?: string;
  asyncId?: string;

  constructor({
    asyncType,
    asyncId,
  }: {
    asyncType?: string;
    asyncId?: string;
  }) {
    super();

    this.asyncType = asyncType;
    this.asyncId = asyncId;
  }

  get(): TValue | null {
    return this.#data as TValue | null;
  }

  /** @internal */
  _toOps(parentId: string, parentKey: string, pool?: ManagedPool): CreateOp[] {
    if (this._id === undefined) {
      throw new Error("Cannot serialize item is not attached");
    }

    const opId = pool?.generateOpId();

    const ops: CreateOp[] = [];
    const op: CreateAsyncRegisterOp = {
      type: OpCode.CREATE_ASYNC_REGISTER,
      id: this._id,
      opId,
      parentId,
      parentKey,

      asyncType: this.asyncType,
      asyncId: this.asyncId,
    };

    ops.push(op);

    if (this.#data !== null) {
      if (isLiveStructure(this.#data)) {
        ops.push(...this.#data._toOps(this._id, "data", pool));
      }
    }

    return ops;
  }

  /** @internal */
  static _deserialize(
    [id, item]: IdTuple<SerializedAsyncRegister>,
    _parentToChildren: ParentToChildNodeMap,
    pool: ManagedPool
  ): LiveAsyncRegister<LiveObject<LsonObject>> {
    const asyncRegister = new LiveAsyncRegister({
      asyncType: item.asyncType,
      asyncId: item.asyncId,
    });
    asyncRegister._attach(id, pool);
    // @TODO: can process children if exist
    return asyncRegister;
  }

  /** @internal */
  _attach(id: string, pool: ManagedPool): void {
    super._attach(id, pool);
  }

  /** @internal */
  _attachChild(_: CreateOp): ApplyResult {
    throw new Error("Method not implemented.");
  }

  /** @internal */
  _initialize(child: Lson) {
    if (isLiveStructure(child)) {
      this.#data = child;
      child._setParentLink(this, "data");
      this.invalidate();
    }
  }

  /** @internal */
  _detachChild(_child: LiveNode): ApplyResult {
    throw new Error("Method not implemented.");
  }

  /** @internal */
  _apply(op: Op, isLocal: boolean): ApplyResult {
    return super._apply(op, isLocal);
  }

  /** @internal */
  _serialize(): SerializedAsyncRegister {
    if (this.parent.type !== "HasParent" || !this.parent.node._id) {
      throw new Error(
        "Cannot serialize LiveAsyncRegister if parent is missing"
      );
    }

    return {
      type: CrdtType.ASYNC_REGISTER,
      parentId: nn(this.parent.node._id, "Parent node expected to have ID"),
      parentKey: this.parent.key,
      asyncType: this.asyncType,
      asyncId: this.asyncId,
    };
  }

  toImmutable(): ToImmutable<LiveAsyncRegister<TValue>> {
    // Don't implement actual toImmutable logic in here. Implement it in
    // ._toImmutable() instead. This helper merely exists to help TypeScript
    // infer better return types.
    return super.toImmutable() as ToImmutable<LiveAsyncRegister<TValue>>;
  }

  /** @internal */
  toTreeNode(key: string): DevTools.LiveTreeNode<"LiveAsyncRegister"> {
    // Don't implement actual toTreeNode logic in here. Implement it in
    // ._toTreeNode() instead. This helper merely exists to help TypeScript
    // infer better return types.
    return super.toTreeNode(key) as DevTools.LiveTreeNode<"LiveAsyncRegister">;
  }

  /** @internal */
  _toTreeNode(key: string): DevTools.LsonTreeNode {
    const nodeId = this._id ?? nanoid();
    return {
      type: "LiveAsyncRegister",
      id: nodeId,
      key,
      payload: this.#data
        ? [
            isLiveNode(this.#data)
              ? this.#data.toTreeNode(key)
              : {
                  type: "Json",
                  id: `${nodeId}:${key}`,
                  key,
                  payload: this.#data,
                },
          ]
        : [],
    };
  }

  /** @internal */
  _toImmutable(): ToImmutable<LiveAsyncRegister<TValue>> {
    if (!this.#data) {
      return { data: null };
    }

    return {
      data: lsonToLiveNode(this.#data).toImmutable() as ToImmutable<TValue>,
    };
  }

  clone(): LiveAsyncRegister<TValue> {
    throw new Error("clone not implemented");
    // TODO: need to pass data too? or do something even worse?
    /*
    return new LiveAsyncRegister({
      asyncType: this.asyncType,
      asyncId: this.asyncId,
    });
    */
  }
}
