// =====================================================================
// FeedbackClient — envoie un message du formulaire « Ton avis » par e-mail
// ---------------------------------------------------------------------
// Le site n'a pas de serveur : c'est Web3Forms qui reçoit le message et le
// transmet par e-mail à l'équipe. La clé d'accès est dans config.js.
// Contrairement aux autres services (qui lisent des données avec GET),
// celui-ci envoie (POST) : pas de cache, pas de serveur de secours.
// =====================================================================

import { API, FEEDBACK, SETTINGS } from "../config.js";
import { ApiError } from "./ApiClient.js";

export class FeedbackClient {
  get isConfigured() {
    return Boolean(FEEDBACK.accessKey);
  }

  async send(feedback) {
    if (!this.isConfigured) {
      throw new ApiError("Le formulaire n’est pas encore relié à une boîte e-mail : la clé Web3Forms manque dans js/config.js.");
    }
    let response;
    try {
      response = await fetch(API.feedback, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: FEEDBACK.accessKey, ...feedback.toJSON() }),
        signal: AbortSignal.timeout(SETTINGS.requestTimeout),
      });
    } catch (error) {
      throw new ApiError(error.name === "TimeoutError"
        ? "Le service d’envoi ne répond pas."
        : "Impossible de joindre le service d’envoi : vérifie ta connexion internet.");
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      throw new ApiError(`L’envoi a été refusé (${result.message || `erreur ${response.status}`}).`, response.status);
    }
    return result;
  }
}
