/**
 * SHEAZ — Quiz de bien-être (S11C)
 * 4 thèmes × 8 questions : nutrition, sommeil, stress, sport.
 * Chaque question : 4 réponses, index correct, mini-explication.
 */
export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

export type QuizKey = 'nutrition' | 'sommeil' | 'stress' | 'sport';

export const QUIZZES: Record<QuizKey, { title: string; icon: string; questions: QuizQuestion[] }> = {
  nutrition: {
    title: 'Quiz Nutrition',
    icon: 'food-apple',
    questions: [
      { q: 'Quelle source de protéines est la plus maigre ?', options: ['Blanc de poulet', 'Entrecôte', 'Saucisson', 'Cheddar'], correct: 0, explain: 'Le blanc de poulet apporte ~31 g de protéines/100 g pour seulement 3 g de graisses.' },
      { q: 'Quel aliment contient le plus de fibres ?', options: ['Pain blanc', 'Lentilles cuites', 'Riz blanc', 'Compote'], correct: 1, explain: 'Les lentilles apportent ~8 g de fibres/100 g, contre 1-2 g pour les autres.' },
      { q: 'Combien de verres d’eau par jour environ ?', options: ['3-4', '6-8', '10-12', '15+'], correct: 1, explain: '6 à 8 verres (1,5-2 L) couvrent les besoins d’un adulte actif.' },
      { q: 'Quel est le meilleur encas avant le sport ?', options: ['Banane', 'Barre chocolatée', 'Chips', 'Rien'], correct: 0, explain: 'La banane apporte des glucides rapides + potassium, idéal 30-60 min avant.' },
      { q: 'Lequel est riche en oméga-3 ?', options: ['Saumon', 'Poulet', 'Riz', 'Yaourt'], correct: 0, explain: 'Le saumon est l’une des meilleures sources d’oméga-3 anti-inflammatoires.' },
      { q: 'Combien de fruits et légumes par jour ?', options: ['1-2', '3-4', '5+', 'Aucun besoin'], correct: 2, explain: 'L’OMS recommande au moins 5 portions par jour.' },
      { q: 'Quel sucre est le plus néfaste en excès ?', options: ['Sucre ajouté', 'Sucre des fruits', 'Sucre du lait', 'Tous égaux'], correct: 0, explain: 'Le sucre ajouté (sodas, pâtisseries) fait grimper la glycémie sans nutriments.' },
      { q: 'Après un effort, que faut-il privilégier ?', options: ['Protéines + glucides', 'Uniquement gras', 'Un soda', 'Jeûner'], correct: 0, explain: 'La fenêtre de récupération combine protéines (muscles) et glucides (glycogène).' },
    ],
  },
  sommeil: {
    title: 'Quiz Sommeil',
    icon: 'weather-night',
    questions: [
      { q: 'Quelle durée de sommeil pour un adulte ?', options: ['4-5 h', '6-7 h', '7-9 h', '10 h+'], correct: 2, explain: '7 à 9 heures est la zone idéale pour la récupération.' },
      { q: 'Quelle température idéale pour dormir ?', options: ['16-18 °C', '22-24 °C', '26-28 °C', 'Peu importe'], correct: 0, explain: 'Une chambre fraîche (16-18 °C) favorise l’endormissement.' },
      { q: 'Que faut-il éviter 1 h avant le coucher ?', options: ['Lire', 'Écrans', 'Étirements doux', 'Tisane'], correct: 1, explain: 'La lumière bleue des écrans retarde la production de mélatonine.' },
      { q: 'Combien de café max dans l’après-midi ?', options: ['3 tasses', '1 tasse avant 14 h', 'Aucune limite', '2 tasses le soir'], correct: 1, explain: 'La caféine a une demi-vie de 5-6 h : une tasse à 16 h perturbe encore le sommeil.' },
      { q: 'La sieste idéale dure…', options: ['10-20 min', '1 h', '2 h', '30 s'], correct: 0, explain: '10-20 minutes suffisent pour recharger sans entrer en sommeil profond.' },
      { q: 'Quel rythme est le plus régénérateur ?', options: ['Se coucher/se lever à heures fixes', 'Horaires aléatoires', 'Grasses matinées le week-end', 'Dormir en journée'], correct: 0, explain: 'La régularité synchronise l’horloge interne (rythme circadien).' },
      { q: 'Un bon dîner pour dormir contient…', options: ['Légumes + protéines légères', 'Gras saturés + fritures', 'Sucres rapides', 'Rien du tout'], correct: 0, explain: 'Un repas léger et digeste évite les réveils nocturnes.' },
      { q: 'L’alcool avant de dormir…', options: ['Améliore le sommeil', 'Fragmenté le sommeil profond', 'N’a aucun effet', 'Allonge les rêves'], correct: 1, explain: 'L’alcool endort vite mais casse le sommeil profond et les cycles.' },
    ],
  },
  stress: {
    title: 'Quiz Stress',
    icon: 'brain',
    questions: [
      { q: 'La respiration 4-7-8 sert à…', options: ['Calmer le système nerveux', 'Augmenter le rythme cardiaque', 'Mieux digérer', 'Courir plus vite'], correct: 0, explain: 'Inspire 4 s, retiens 7 s, expire 8 s : active le parasympathique.' },
      { q: 'Quel sport est le plus efficace anti-stress ?', options: ['Cardio modéré', 'Aucun', 'Toujours s’épuiser', 'Regarder la TV'], correct: 0, explain: '30 min de cardio modéré libèrent des endorphines et réduisent le cortisol.' },
      { q: 'La cohérence cardiaque, c’est…', options: ['6 respirations/min', '30 respirations/min', 'Retenir son souffle', 'Hyperventiler'], correct: 0, explain: '6 cycles/min synchronisent cœur et respiration : 5 min, 3×/jour.' },
      { q: 'Quel aliment augmente le stress ?', options: ['Café en excès', 'Amandes', 'Saumon', 'Thé vert'], correct: 0, explain: 'Trop de caféine maintient un état de vigilance (cortisol élevé).' },
      { q: 'Le meilleur réflexe face à une montée de stress ?', options: ['Souffler lentement', 'Retenir sa respiration', 'Serrer les mâchoires', 'Sucrer'], correct: 0, explain: 'L’expiration lente signale au cerveau que le danger est passé.' },
      { q: 'Un cerveau stressé a besoin de…', options: ['Sommeil + pauses', 'Plus de café', 'Écrans', 'Sauter les repas'], correct: 0, explain: 'Le sommeil et les pauses régénèrent les circuits émotionnels.' },
      { q: 'La pleine conscience (mindfulness)…', options: ['Réduit l’anxiété', 'Augmente le stress', 'Nuit à la mémoire', 'Est un mythe'], correct: 0, explain: '10 min/jour de pleine conscience réduisent l’anxiété et améliorent la concentration.' },
      { q: 'Une marche de 10 min en nature…', options: ['Fait baisser le cortisol', 'N’a aucun effet', 'Augmente la tension', 'Empêche de dormir'], correct: 0, explain: 'L’exposition à la nature réduit le cortisol et la pression artérielle.' },
    ],
  },
  sport: {
    title: 'Quiz Sport',
    icon: 'dumbbell',
    questions: [
      { q: 'Combien de séances de sport/semaine ?', options: ['2-3', '0-1', '7', '1 par mois'], correct: 0, explain: '2 à 3 séances/semaine suffisent pour des gains visibles (OMS).' },
      { q: 'L’échauffement sert à…', options: ['Préparer muscles et cœur', 'Perdre du temps', 'Fatiguer', 'Remplacer l’étirement'], correct: 0, explain: '5-10 min d’échauffement progressif réduisent les blessures de 50%.' },
      { q: 'La meilleure façon de progresser ?', options: ['Progression régulière', 'Tout d’un coup', 'Jamais changer', 'Copier un pro'], correct: 0, explain: '+5-10% par semaine (charge, durée) = progrès durable sans blessure.' },
      { q: 'La récupération fait partie…', options: ['De l’entraînement', 'Du temps perdu', 'Des vacances', 'De l’optionnel'], correct: 0, explain: 'C’est pendant la récupération que le muscle se reconstruit.' },
      { q: 'Le cardio idéal pour la forme générale ?', options: ['30 min modérées', '3 min intenses', '10 h par jour', 'Jamais'], correct: 0, explain: '150 min/semaine d’activité modérée (OMS) protège le cœur.' },
      { q: 'Après une séance, il faut…', options: ['Manger protéines + s’hydrater', 'Ne rien manger', 'Sucrer à outrance', 'Dormir 10 h'], correct: 0, explain: 'La fenêtre de 30-60 min après l’effort optimise la récupération.' },
      { q: 'La musculation est utile pour…', options: ['La santé osseuse', 'Rien de particulier', 'Seulement les bodybuilders', 'Perdre du muscle'], correct: 0, explain: 'Elle renforce os, articulations et métabolisme de base.' },
      { q: 'Le bon indicateur d’effort ?', options: ['Parler sans être essoufflé (modéré)', 'Ne pas transpirer', 'Douleur intense', 'Essoufflement total'], correct: 0, explain: '« Test de la parole » : en modéré, on peut parler en phrases courtes.' },
    ],
  },
};

export const DAILY_QUESTIONS: { q: string; options: string[]; correct: number; explain: string; fact: string }[] = [
  { q: 'Vrai ou faux : il faut boire 8 verres d’eau par jour.', options: ['Vrai, c’est la règle d’or', 'Faux, ça dépend de chacun'], correct: 1, explain: 'Les besoins varient (activité, climat, alimentation) — l’urine claire est le meilleur indicateur.', fact: 'L’eau couvre ~60% du poids du corps.' },
  { q: 'Quel est l’aliment le plus riche en vitamine C ?', options: ['Orange', 'Kiwi', 'Poivron rouge', 'Citron'], correct: 2, explain: 'Le poivron rouge en contient ~190 mg/100 g, plus que l’orange (~53 mg).', fact: 'La vitamine C est sensible à la chaleur : préférez les crudités.' },
  { q: 'Combien de temps faut-il pour former une habitude ?', options: ['3 jours', '21 jours', '~66 jours en moyenne', '1 an'], correct: 2, explain: 'Les études (Lally, 2010) montrent 18 à 254 jours, moyenne 66.', fact: 'La régularité compte plus que l’intensité.' },
  { q: 'Lequel aide le plus à s’endormir ?', options: ['Tisane + lecture', 'Écran + réseaux', 'Sport intense tard', 'Café décaféiné'], correct: 0, explain: 'Une routine calme signale au corps qu’il est temps de ralentir.', fact: 'La mélatonine est sécrétée ~2 h avant le coucher.' },
  { q: 'Le squat sollicite principalement…', options: ['Les cuisses et fessiers', 'Les biceps', 'Les épaules', 'Les mollets seuls'], correct: 0, explain: 'C’est l’exercice roi du bas du corps.', fact: 'Un squat maîtrisé protège les genoux.' },
  { q: 'Quel macro-nutriment est la principale source d’énergie ?', options: ['Glucides', 'Protéines', 'Lipides', 'Vitamines'], correct: 0, explain: 'Les glucides sont le carburant préféré du cerveau et des muscles.', fact: 'Un sportif doit manger ~3-5 g de glucides/kg/jour.' },
  { q: 'Vrai ou faux : transpirer fait maigrir.', options: ['Vrai, c’est de la graisse', 'Faux, c’est de l’eau'], correct: 1, explain: 'La transpiration élimine de l’eau, pas de la graisse — réhydratez-vous !', fact: 'La graisse est surtout éliminée par le CO2 expiré.' },
  { q: 'Le stress chronique augmente…', options: ['Le cortisol', 'La mélatonine', 'La sérotonine', 'Les oméga-3'], correct: 0, explain: 'Le cortisol élevé en continu fatigue le corps et le mental.', fact: 'Le rire réduit naturellement le cortisol.' },
];

export function dailyQuestion(date: Date): (typeof DAILY_QUESTIONS)[0] {
  const start = new Date(2026, 0, 1);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return DAILY_QUESTIONS[((day % DAILY_QUESTIONS.length) + DAILY_QUESTIONS.length) % DAILY_QUESTIONS.length];
}
