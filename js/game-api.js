/**
 * Ponte para Cloud Functions v2 (economia).
 * Fallback local só se zyroCloudEconomy !== "true" (dev sem emulador).
 */
import { app } from "../firebase.js";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const REGION = "southamerica-east1";
const USE_CLOUD_STORAGE_KEY = "zyroCloudEconomy";

let functionsInstance = null;
let emulatorConnected = false;

function useCloudEconomy() {
  return localStorage.getItem(USE_CLOUD_STORAGE_KEY) !== "false";
}

function getFns() {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app, REGION);
  }

  if (
    !emulatorConnected &&
    (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ) {
    try {
      connectFunctionsEmulator(functionsInstance, "127.0.0.1", 5001);
      emulatorConnected = true;
      console.info("[game-api] Emulador de Functions conectado (5001).");
    } catch (error) {
      console.warn("[game-api] Emulador já conectado ou indisponível:", error?.message);
    }
  }

  return functionsInstance;
}

function callable(name) {
  return httpsCallable(getFns(), name);
}

export function applyUserPatch(target, patch = {}) {
  if (!target || !patch) return target;
  Object.assign(target, patch);
  return target;
}

export async function completeLesson(payload) {
  if (!useCloudEconomy()) return null;
  const fn = callable("completeLesson");
  const result = await fn(payload);
  return result.data;
}

export async function claimMission(payload) {
  if (!useCloudEconomy()) return null;
  const fn = callable("claimMission");
  const result = await fn(payload);
  return result.data;
}

export async function purchaseShopItem(payload) {
  if (!useCloudEconomy()) return null;
  const fn = callable("purchaseShopItem");
  const result = await fn(payload);
  return result.data;
}

export async function equipCosmetic(payload) {
  if (!useCloudEconomy()) return null;
  const fn = callable("equipCosmetic");
  const result = await fn(payload);
  return result.data;
}

export { useCloudEconomy, USE_CLOUD_STORAGE_KEY };
