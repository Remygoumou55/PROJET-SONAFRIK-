import { createISRCEngine } from "../ISRCEngine";
import { ISO3901_FORMAT_CONFIG } from "../config/defaultFormatConfig";
import type { ISRCSequenceKey } from "@sonafrik/types";

export interface ISRCPerformanceMetrics {
  readonly parseMs: number;
  readonly normalizeMs: number;
  readonly validateFormatMs: number;
  readonly generateMs: number;
  readonly reserveMs: number;
  readonly iterations: number;
}

const SAMPLE = "GN-SFK-24-00001";
const KEY: ISRCSequenceKey = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "99" };

/** Technical dashboard helper — headless performance sampling */
export async function measureISRCPerformance(
  iterations = 100,
): Promise<ISRCPerformanceMetrics> {
  const engine = createISRCEngine({ config: ISO3901_FORMAT_CONFIG });

  const parseStart = performance.now();
  for (let i = 0; i < iterations; i++) engine.parse(SAMPLE);
  const parseMs = (performance.now() - parseStart) / iterations;

  const normalizeStart = performance.now();
  for (let i = 0; i < iterations; i++) engine.normalize(SAMPLE);
  const normalizeMs = (performance.now() - normalizeStart) / iterations;

  const validateStart = performance.now();
  for (let i = 0; i < iterations; i++) engine.validateFormat(SAMPLE);
  const validateFormatMs = (performance.now() - validateStart) / iterations;

  const generateStart = performance.now();
  for (let i = 0; i < iterations; i++) await engine.generate(KEY);
  const generateMs = (performance.now() - generateStart) / iterations;

  const isrc = await engine.generate(KEY);
  await engine.register(isrc);

  const reserveStart = performance.now();
  const fresh = await engine.generate(KEY);
  for (let i = 0; i < iterations; i++) {
    await engine.reserve(fresh, "perf-actor", `perf-${i}`);
    await engine.release(fresh, "perf-actor", `perf-${i}`);
  }
  const reserveMs = (performance.now() - reserveStart) / iterations;

  return {
    parseMs,
    normalizeMs,
    validateFormatMs,
    generateMs,
    reserveMs,
    iterations,
  };
}
