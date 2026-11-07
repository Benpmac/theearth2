// =====================================================================
// Feedback — un message laissé par un visiteur dans le formulaire « Ton avis »
// ---------------------------------------------------------------------
// La classe sait trois choses :
//   • ce qu'un message contient (type, note, pays, texte, nom, e-mail) ;
//   • s'il est complet : feedback.errors donne les erreurs champ par champ ;
//   • comment l'écrire pour l'envoi : feedback.toJSON().
// La page (FeedbackPage) affiche le formulaire, le service (FeedbackClient) l'envoie.
// =====================================================================

export class Feedback {
  static TYPES = {
    suggestion: "Une suggestion",
    avis: "Un avis sur le site",
    erreur: "Une erreur à signaler",
  };

  static RATINGS = ["Décevant", "Moyen", "Bien", "Très bien", "Excellent"];
  static MIN_LENGTH = 10;
  static MAX_LENGTH = 2000;

  constructor({ type = "suggestion", rating = null, country = null, message = "", name = "", email = "" } = {}) {
    this.type = type in Feedback.TYPES ? type : "suggestion";
    this.rating = this.type === "avis" && rating ? Number(rating) : null;   // de 1 à 5, seulement pour un avis
    this.country = country;              // un objet Country, ou null : le site en général
    this.message = message.trim();
    this.name = name.trim();
    this.email = email.trim();
  }

  // Les erreurs de saisie, par champ : { message: "…", email: "…" } ; un objet vide si tout va bien
  get errors() {
    const errors = {};
    if (!this.message) errors.message = "Écris ton message ici.";
    else if (this.message.length < Feedback.MIN_LENGTH) errors.message = `Ton message est un peu court : ${Feedback.MIN_LENGTH} caractères au moins.`;
    else if (this.message.length > Feedback.MAX_LENGTH) errors.message = `Ton message est trop long : ${Feedback.MAX_LENGTH} caractères au plus.`;
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email)) errors.email = "Cette adresse e-mail semble incomplète (exemple : prenom@exemple.com).";
    return errors;
  }

  get isValid() {
    return Object.keys(this.errors).length === 0;
  }

  get typeLabel() {
    return Feedback.TYPES[this.type];
  }

  // L'objet de l'e-mail reçu : on voit d'un coup d'œil de quoi il s'agit
  get subject() {
    return `TheEarth · ${this.typeLabel}${this.country ? ` · ${this.country.name}` : ""}`;
  }

  // Ce qui est envoyé : chaque champ devient une ligne de l'e-mail reçu
  toJSON() {
    return {
      subject: this.subject,
      from_name: "TheEarth",
      name: this.name || "Anonyme",
      ...(this.email && { email: this.email }),   // l'adresse de réponse de l'e-mail
      "Type de message": this.typeLabel,
      ...(this.rating && { Note: `${this.rating}/5 (${Feedback.RATINGS[this.rating - 1]})` }),
      "Pays concerné": this.country ? `${this.country.name} (${this.country.code})` : "Le site en général",
      message: this.message,
    };
  }
}
