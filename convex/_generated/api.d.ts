/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as enneagram from "../enneagram.js";
import type * as http from "../http.js";
import type * as mood from "../mood.js";
import type * as pomodoro from "../pomodoro.js";
import type * as router from "../router.js";
import type * as routines from "../routines.js";
import type * as tasks from "../tasks.js";
import type * as transformation from "../transformation.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  chat: typeof chat;
  enneagram: typeof enneagram;
  http: typeof http;
  mood: typeof mood;
  pomodoro: typeof pomodoro;
  router: typeof router;
  routines: typeof routines;
  tasks: typeof tasks;
  transformation: typeof transformation;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
