import type { StreamingRuntimeContext } from "../../runtime/streaming-runtime-context";

export type StreamingApplicationContext = StreamingRuntimeContext;

export { createRuntimeContext as createApplicationContext } from "../../runtime/streaming-runtime-context";
export { assertRuntimeContext as assertApplicationContext } from "../../runtime/streaming-runtime-context";
