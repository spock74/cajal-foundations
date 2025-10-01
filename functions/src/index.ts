/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import fetch from "node-fetch";

// Define a type for the function's expected input
interface FetchUrlRequest {
  url: string;
}

// Create the callable function
export const fetchUrlContent = onCall<FetchUrlRequest>({ cors: true }, async (request) => {
  const { url } = request.data;

  logger.info(`Fetching content from URL: ${url}`, {structuredData: true});

  if (!url) {
    throw new HttpsError("invalid-argument", "The function must be called with one argument 'url'.");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpsError("unavailable", `Failed to fetch URL: ${response.statusText}`);
    }
    const textContent = await response.text();
    return { content: textContent };
  } catch (error) {
    logger.error("Error fetching URL:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An unexpected error occurred while fetching the URL.");
  }
});
