import { describe, expect, it } from "vitest";
import { buildShuffledOrder, resolveNextQueueIndex, resolvePrevQueueIndex } from "./playerQueueUtils";

describe("buildShuffledOrder", () => {
  it("retourne [currentIndex, ...autres indices mélangés]", () => {
    const order = buildShuffledOrder(5, 2);
    expect(order[0]).toBe(2);
    expect(order).toHaveLength(5);
    expect(new Set(order).size).toBe(5);
    expect(order.every((i) => i >= 0 && i < 5)).toBe(true);
  });

  it("retourne [0] quand length est 1", () => {
    const order = buildShuffledOrder(1, 0);
    expect(order).toEqual([0]);
  });
});

describe("resolveNextQueueIndex", () => {
  it("passe à la piste suivante en mode linéaire", () => {
    const result = resolveNextQueueIndex(5, 0, false, "off", []);
    expect(result).toEqual({ nextIndex: 1, shuffledOrder: [] });
  });

  it("s'arrête en fin de file d'attente sans repeat", () => {
    const result = resolveNextQueueIndex(5, 4, false, "off", []);
    expect(result).toBeNull();
  });

  it("repart à 0 en repeat-all linéaire", () => {
    const result = resolveNextQueueIndex(5, 4, false, "all", []);
    expect(result).toEqual({ nextIndex: 0, shuffledOrder: [] });
  });

  it("reste sur la piste courante en repeat-one", () => {
    const result = resolveNextQueueIndex(5, 3, false, "one", []);
    expect(result).toEqual({ nextIndex: 3, shuffledOrder: [] });
  });

  it("passe à la piste suivante dans l'ordre mélangé", () => {
    const shuffledOrder = [2, 4, 1, 0, 3];
    const result = resolveNextQueueIndex(5, 2, true, "off", shuffledOrder);
    expect(result).toEqual({ nextIndex: 4, shuffledOrder });
  });

  it("reshuffle en repeat-all/shuffle à la fin du mélangé", () => {
    const shuffledOrder = [2, 4, 1, 0, 3];
    const result = resolveNextQueueIndex(5, 3, true, "all", shuffledOrder);
    expect(result).not.toBeNull();
    expect(result!.shuffledOrder).not.toEqual(shuffledOrder);
    expect(result!.shuffledOrder[0]).toBe(3);
    expect(result!.nextIndex).not.toBe(3);
  });

  it("renvoie null en shuffle sans repeat à la fin", () => {
    const shuffledOrder = [2, 4, 1, 0, 3];
    const result = resolveNextQueueIndex(5, 3, true, "off", shuffledOrder);
    expect(result).toBeNull();
  });

  it("renvoie null si la file d'attente est vide", () => {
    const result = resolveNextQueueIndex(0, 0, false, "off", []);
    expect(result).toBeNull();
  });
});

describe("resolvePrevQueueIndex", () => {
  it("passe à la piste précédente en mode linéaire", () => {
    expect(resolvePrevQueueIndex(5, 2, false, "off", [], 0)).toBe(1);
  });

  it("reste sur la piste si elle a joué plus de 3 secondes", () => {
    expect(resolvePrevQueueIndex(5, 2, false, "off", [], 5)).toBe(2);
  });

  it("repart en fin de liste en repeat-all linéaire", () => {
    expect(resolvePrevQueueIndex(5, 0, false, "all", [], 0)).toBe(4);
  });

  it("revient au morceau précédent dans l'ordre mélangé", () => {
    const shuffledOrder = [2, 4, 1, 0, 3];
    expect(resolvePrevQueueIndex(5, 1, true, "off", shuffledOrder, 0)).toBe(4);
  });

  it("repart à la fin du mélangé en repeat-all/shuffle", () => {
    const shuffledOrder = [2, 4, 1, 0, 3];
    expect(resolvePrevQueueIndex(5, 2, true, "all", shuffledOrder, 0)).toBe(3);
  });
});
