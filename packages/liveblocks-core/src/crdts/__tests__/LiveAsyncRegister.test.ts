import { objectUpdate } from "../../__tests__/_updatesUtils";
import {
  createSerializedAsyncRegister,
  createSerializedList,
  createSerializedObject,
  prepareDisconnectedStorageUpdateTest,
  prepareIsolatedStorageTest,
  prepareStorageTest,
  replaceRemoteStorageAndReconnect,
} from "../../__tests__/_utils";
import { waitUntilStorageUpdate } from "../../__tests__/_waitUtils";
import { kInternal } from "../../internal";
import { Permission } from "../../protocol/AuthToken";
import { OpCode } from "../../protocol/Op";
import type { IdTuple, SerializedCrdt } from "../../protocol/SerializedCrdt";
import { CrdtType } from "../../protocol/SerializedCrdt";
import { LiveAsyncRegister } from "../LiveAsyncRegister";
import { LiveList } from "../LiveList";
import { LiveObject } from "../LiveObject";

describe("LiveAsyncRegister", () => {
  describe("roomId", () => {
    it("should be null for orphan", () => {
      expect(
        new LiveAsyncRegister({ asyncType: undefined, asyncId: "12345" }).roomId
      ).toBeNull();
    });

    it("should be the associated room id if attached", async () => {
      const { root } = await prepareIsolatedStorageTest(
        [createSerializedObject("root", {})],
        1
      );

      expect(root.roomId).toBe("room-id");
    });

    it("should be null after being detached", async () => {
      type Storage = {
        child: LiveAsyncRegister<LiveObject<{ a: number }>>;
      };
      const { root } = await prepareIsolatedStorageTest<Storage>(
        [
          createSerializedObject("root", {}),
          createSerializedAsyncRegister(
            "0:0",
            "root",
            "child",
            undefined,
            "12345"
          ),
        ],
        1
      );

      const child = root.get("child");

      expect(child.roomId).toBe("room-id");

      root.set(
        "child",
        new LiveAsyncRegister({ asyncType: undefined, asyncId: "12345" })
      );

      expect(child.roomId).toBe(null);
    });
  });

  it("load storage with async register", async () => {
    const {
      root,
      expectStorage,
      applyRemoteOperations,
      initializeAsyncRegister,
    } = await prepareIsolatedStorageTest<{
      register: LiveAsyncRegister<LiveObject<{ a: number }>>;
    }>(
      [
        createSerializedObject("root", {}),
        createSerializedAsyncRegister(
          "0:1",
          "root",
          "register",
          undefined,
          "12345"
        ),
      ],
      1
    );

    expectStorage({ register: { data: null } });

    initializeAsyncRegister(
      [createSerializedObject("0:2", { a: 5 }, "0:1", "data")],
      "0:2",
      "0:1"
    );

    expectStorage({ register: { data: { a: 5 } } });
  });
});
