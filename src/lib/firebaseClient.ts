import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { cloudConfig, isCloudConfigured } from "./cloudConfig";

export const firebaseApp = isCloudConfigured
  ? (getApps()[0] ?? initializeApp(cloudConfig.firebase))
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const cloudFunctions = firebaseApp
  ? getFunctions(firebaseApp, cloudConfig.firebaseFunctionsRegion)
  : null;
