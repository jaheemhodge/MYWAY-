import { beforeEach, describe, expect, it } from "vitest";
import { addToList, FAVORITES_STORAGE_KEY, readLocalFavorites, removeFromList, writeLocalFavorites, type KeyValueStore } from "./favorites";

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("local favorites", () => {
  beforeEach(() => {
    writeLocalFavorites([], memoryStore());
  });

  it("reads the prototype's storage key so earlier hearts carry over", () => {
    const kv = memoryStore({ [FAVORITES_STORAGE_KEY]: JSON.stringify(["K01", "G01"]) });
    expect(readLocalFavorites(kv)).toEqual(["K01", "G01"]);
  });

  it("drops junk and duplicates", () => {
    const kv = memoryStore({ [FAVORITES_STORAGE_KEY]: JSON.stringify(["K01", 3, null, "K01", "", "B02"]) });
    expect(readLocalFavorites(kv)).toEqual(["K01", "B02"]);
  });

  it("survives unreadable storage by keeping the in-memory copy", () => {
    const kv = memoryStore();
    writeLocalFavorites(["H01"], kv);
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readLocalFavorites(broken)).toEqual(["H01"]);
    expect(writeLocalFavorites(["H01", "H02"], broken)).toEqual(["H01", "H02"]);
  });

  it("add/remove are pure and idempotent", () => {
    expect(addToList([], "K01")).toEqual(["K01"]);
    expect(addToList(["K01"], "K01")).toEqual(["K01"]);
    expect(removeFromList(["K01", "K02"], "K01")).toEqual(["K02"]);
    expect(removeFromList([], "K01")).toEqual([]);
  });
});
