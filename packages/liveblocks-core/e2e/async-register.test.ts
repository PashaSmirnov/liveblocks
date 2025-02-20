import { LiveObject, wait, type Immutable } from "../src";
import { LiveAsyncRegister } from "../src/crdts/LiveAsyncRegister";
import {
  initializeRoomForTest,
  prepareSingleClientTest,
  prepareTestsConflicts,
} from "./utils";

type TestRoom = {
  reg?: LiveAsyncRegister<LiveObject<{ foo: number; bar: string }>>;
};

describe("LiveAsyncRegister single client", () => {
  test(
    "created rector is populated with data",
    prepareSingleClientTest<TestRoom>(
      {
        reg: undefined,
      },
      async ({ root, flushSocketMessages, room }) => {
        const states: Immutable[] = [];
        room.subscribe(root, () => states.push(root.toImmutable()), {
          isDeep: true,
        });

        root.set(
          "reg",
          new LiveAsyncRegister({ asyncType: "rector", asyncId: "1234" })
        );

        await flushSocketMessages();

        expect(states).toEqual([
          { reg: { data: null } },
          { reg: { data: { foo: 1, bar: "zog" } } },
        ]);
      }
    )
  );

  test(
    "rector is synced between clients",
    prepareTestsConflicts<TestRoom>(
      {
        reg: undefined,
      },
      async ({ root1, root2, wsUtils, assert }) => {
        root1.set(
          "reg",
          new LiveAsyncRegister({ asyncType: "rector", asyncId: "1234" })
        );

        await wsUtils.flushSocket1Messages();

        assert({
          reg: { data: { foo: 1, bar: "zog" } },
        });

        root1.get("reg")?.get()?.set("foo", 2);
        await wsUtils.flushSocket1Messages();

        assert({
          reg: { data: { foo: 2, bar: "zog" } },
        });

        root2.get("reg")?.get()?.set("foo", 3);
        await wsUtils.flushSocket2Messages();

        assert({
          reg: { data: { foo: 3, bar: "zog" } },
        });
      }
    )
  );

  test(
    "rector state visible after reconnect",
    prepareSingleClientTest<TestRoom>(
      {
        reg: undefined,
      },
      async ({ root, flushSocketMessages, room }) => {
        root.set(
          "reg",
          new LiveAsyncRegister({ asyncType: "rector", asyncId: "1234" })
        );

        await flushSocketMessages();

        root.get("reg")?.get()?.set("foo", 2);
        await flushSocketMessages();

        const actor = await initializeRoomForTest<
          never,
          TestRoom,
          never,
          never,
          never
        >(room.id, {} as never, { reg: undefined });

        try {
          const { root: root2 } = await actor.room.getStorage();
          await wait(1000);

          expect(root2.toImmutable()).toEqual({
            reg: { data: { foo: 2, bar: "zog" } },
          });
        } finally {
          actor.leave();
        }
      }
    )
  );
});
