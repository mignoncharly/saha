export interface FAQItem {
  question: string;
  answer: string;
}

/** Shared FAQ content, used by the FAQ page and the home-page preview. */
export const faqItems: FAQItem[] = [
  {
    question: "Comment demander un ramassage ?",
    answer:
      "Rendez-vous sur la page « Demander un ramassage », remplissez le formulaire avec vos informations et celles de vos biens. Vous recevrez un numéro de référence et serez contacté rapidement.",
  },
  {
    question: "Quelles villes sont couvertes ?",
    answer:
      "Nous organisons des ramassages dans de nombreuses villes en Allemagne, en France et au Luxembourg : Francfort, Mainz, Darmstadt, Strasbourg, Metz, Luxembourg, Stuttgart, etc.",
  },
  {
    question: "Quelles destinations au Cameroun ?",
    answer: "Nous livrons à Douala, Yaoundé et Bafoussam.",
  },
  {
    question: "Comment connaître le prix exact ?",
    answer:
      "Les prix affichés sont indicatifs. Le prix final dépend du volume, du poids et de la destination. Notre équipe vous fera un devis personnalisé après votre demande.",
  },
  {
    question: "Puis-je envoyer des photos de mes colis ?",
    answer:
      "Oui, le formulaire de demande vous permet d’ajouter des photos pour mieux décrire vos marchandises.",
  },
  {
    question: "Est-ce que le paiement se fait en ligne ?",
    answer:
      "Le paiement en ligne n’est pas encore disponible. Après votre demande, l’équipe STL vous contacte pour confirmer les détails, le prix et les modalités.",
  },
  {
    question: "Comment recevoir les notifications ?",
    answer:
      "Vous pouvez autoriser les notifications push lors de votre visite. Vous serez ainsi informé des prochaines dates de ramassage et de l’avancement de votre demande.",
  },
  {
    question: "Comment suivre ma demande ?",
    answer:
      "Utilisez la page « Suivi de demande » et entrez votre numéro de référence (ex: STL-2026-000123) pour voir l’état de votre envoi.",
  },
];
