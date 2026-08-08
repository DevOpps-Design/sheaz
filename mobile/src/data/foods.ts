/**
 * SHEAZ — Catalogue d'aliments (S11A)
 * 60+ aliments courants avec macros par portion (kcal, protéines, glucides,
 * lipides, fibres, sucres). Le score santé (0-4, style Yuka simplifié) est
 * calculé par `healthScore()` à partir des macros.
 */
export type FoodCategory = 'fruits' | 'legumes' | 'proteines' | 'feculents' | 'laitiers' | 'graisses' | 'boissons' | 'snacks';

export interface Food {
  id: string;
  name: string;
  cat: FoodCategory;
  portion: string; // description de la portion
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
}

export const FOOD_CATEGORIES: { key: FoodCategory; label: string }[] = [
  { key: 'fruits', label: 'Fruits' },
  { key: 'legumes', label: 'Légumes' },
  { key: 'proteines', label: 'Protéines' },
  { key: 'feculents', label: 'Féculents' },
  { key: 'laitiers', label: 'Laitiers' },
  { key: 'graisses', label: 'Graisses & huiles' },
  { key: 'boissons', label: 'Boissons' },
  { key: 'snacks', label: 'Snacks & plaisir' },
];

type Row = [string, string, FoodCategory, string, number, number, number, number, number, number];

const ROWS: Row[] = [
  // id, name, cat, portion, kcal, proteinG, carbsG, fatG, fiberG, sugarG
  ['pomme', 'Pomme', 'fruits', '1 unité (180 g)', 95, 0.5, 25, 0.3, 4.4, 19],
  ['banane', 'Banane', 'fruits', '1 unité (120 g)', 105, 1.3, 27, 0.4, 3.1, 14],
  ['orange', 'Orange', 'fruits', '1 unité (150 g)', 62, 1.2, 15, 0.2, 3.1, 12],
  ['fraise', 'Fraises', 'fruits', '150 g', 48, 1, 11, 0.5, 3, 7],
  ['myrtille', 'Myrtilles', 'fruits', '100 g', 57, 0.7, 14, 0.3, 2.4, 10],
  ['kiwi', 'Kiwi', 'fruits', '1 unité (75 g)', 42, 0.8, 10, 0.4, 2.1, 6],
  ['mangue', 'Mangue', 'fruits', '100 g', 60, 0.8, 15, 0.4, 1.6, 14],
  ['raisin', 'Raisin', 'fruits', '100 g', 69, 0.7, 18, 0.2, 0.9, 16],
  ['avocat', 'Avocat', 'fruits', '1/2 unité (100 g)', 160, 2, 9, 15, 6.7, 0.7],
  ['citron', 'Citron', 'fruits', '1 unité (60 g)', 17, 0.6, 5, 0.2, 1.6, 1.5],
  ['brocoli', 'Brocoli', 'legumes', '200 g', 68, 5.6, 13, 0.8, 5.2, 3.2],
  ['epinard', 'Épinards', 'legumes', '100 g', 23, 2.9, 3.6, 0.4, 2.2, 0.4],
  ['carotte', 'Carotte', 'legumes', '100 g', 41, 0.9, 10, 0.2, 2.8, 4.7],
  ['tomate', 'Tomate', 'legumes', '150 g', 27, 1.3, 5.8, 0.3, 1.8, 3.9],
  ['courgette', 'Courgette', 'legumes', '200 g', 34, 2.4, 6.2, 0.6, 2, 4.8],
  ['poivron', 'Poivron rouge', 'legumes', '100 g', 31, 1, 6, 0.3, 2.1, 4.2],
  ['concombre', 'Concombre', 'legumes', '150 g', 23, 1, 4.9, 0.2, 0.9, 2.6],
  ['haricot_vert', 'Haricots verts', 'legumes', '150 g', 46, 2.8, 10, 0.3, 4.8, 2.4],
  ['champignon', 'Champignons', 'legumes', '100 g', 22, 3.1, 3.3, 0.3, 1, 1.4],
  ['salade', 'Salade verte', 'legumes', '100 g', 15, 1.4, 2.9, 0.2, 1.3, 0.8],
  ['patate_douce', 'Patate douce', 'legumes', '150 g', 129, 2.4, 30, 0.1, 4.5, 6.4],
  ['poireau', 'Poireau', 'legumes', '150 g', 46, 2.3, 10, 0.2, 2.6, 3],
  ['poulet', 'Blanc de poulet', 'proteines', '150 g', 248, 46.5, 0, 5.4, 0, 0],
  ['dinde', 'Escalope de dinde', 'proteines', '150 g', 189, 43.5, 0, 1.8, 0, 0],
  ['boeuf', 'Steak de bœuf 5%', 'proteines', '150 g', 217, 36, 0, 7.5, 0, 0],
  ['saumon', 'Saumon', 'proteines', '150 g', 312, 31.5, 0, 20.2, 0, 0],
  ['thon', 'Thon (pavé)', 'proteines', '120 g', 158, 35, 0, 1.4, 0, 0],
  ['oeuf', 'Œuf', 'proteines', '2 unités (100 g)', 143, 12.6, 0.7, 9.5, 0, 0.7],
  ['lentilles', 'Lentilles cuites', 'proteines', '200 g', 232, 18, 40, 0.8, 15.6, 2],
  ['pois_chiche', 'Pois chiches', 'proteines', '150 g', 246, 13.5, 41, 3.9, 12.4, 4.4],
  ['tofu', 'Tofu ferme', 'proteines', '150 g', 216, 23.4, 4.2, 12.6, 2.2, 0.9],
  ['crevette', 'Crevettes', 'proteines', '150 g', 148, 34.5, 0.7, 1.2, 0, 0],
  ['jambon', 'Jambon blanc', 'proteines', '100 g', 107, 21, 0.5, 3, 0, 0.5],
  ['riz', 'Riz complet cuit', 'feculents', '150 g', 166, 4.2, 34.5, 1.3, 2.6, 0.4],
  ['pates', 'Pâtes complètes', 'feculents', '150 g', 224, 9.4, 44, 1.4, 5.2, 2],
  ['quinoa', 'Quinoa cuit', 'feculents', '150 g', 180, 6.6, 32, 2.8, 4.2, 1.2],
  ['pain_complet', 'Pain complet', 'feculents', '60 g (2 tranches)', 150, 7.6, 26, 2, 3.8, 2.5],
  ['pain_blanc', 'Pain blanc', 'feculents', '60 g (2 tranches)', 162, 5.4, 30, 1.8, 1.8, 2.5],
  ['flocons_avoine', 'Flocons d’avoine', 'feculents', '60 g', 233, 8.2, 39.6, 4.2, 6.2, 0.7],
  ['pomme_terre', 'Pomme de terre cuite', 'feculents', '200 g', 174, 4.6, 40, 0.2, 4.4, 1.6],
  ['boulgour', 'Boulgour cuit', 'feculents', '150 g', 125, 4.4, 27, 0.4, 4.2, 0.4],
  ['lait', 'Lait demi-écrémé', 'laitiers', '250 ml', 119, 8.2, 11.7, 3.7, 0, 11.7],
  ['yaourt_nature', 'Yaourt nature', 'laitiers', '125 g', 76, 5.2, 5.8, 3.5, 0, 5.8],
  ['yaourt_grec', 'Yaourt grec', 'laitiers', '150 g', 171, 14.4, 5.6, 10.4, 0, 5.6],
  ['fromage_blanc', 'Fromage blanc 3%', 'laitiers', '150 g', 105, 10.8, 6.5, 4.1, 0, 6.5],
  ['fromage', 'Emmental', 'laitiers', '30 g', 114, 8.3, 0.4, 8.9, 0, 0.4],
  ['mozzarella', 'Mozzarella', 'laitiers', '60 g', 150, 11, 0.9, 11.5, 0, 0.9],
  ['huile_olive', 'Huile d’olive', 'graisses', '1 c. à soupe (10 ml)', 88, 0, 0, 10, 0, 0],
  ['beurre', 'Beurre', 'graisses', '10 g', 74, 0.1, 0, 8.1, 0, 0],
  ['amandes', 'Amandes', 'graisses', '30 g', 174, 6.4, 6.1, 15, 3.7, 1.2],
  ['noix', 'Noix', 'graisses', '30 g', 196, 4.6, 4.1, 19.6, 2, 0.8],
  ['cacahuetes', 'Cacahuètes', 'graisses', '30 g', 170, 7.7, 4.9, 14.4, 2.7, 1.2],
  ['eau', 'Eau', 'boissons', '1 verre (250 ml)', 0, 0, 0, 0, 0, 0],
  ['the', 'Thé sans sucre', 'boissons', '250 ml', 0, 0, 0, 0, 0, 0],
  ['cafe', 'Café noir', 'boissons', '1 tasse (150 ml)', 2, 0.3, 0, 0, 0, 0],
  ['jus_orange', 'Jus d’orange pressé', 'boissons', '200 ml', 90, 1.4, 21, 0.5, 0.4, 19],
  ['soda', 'Soda sucré', 'boissons', '330 ml', 139, 0, 35, 0, 0, 35],
  ['chocolat_noir', 'Chocolat noir 70%', 'snacks', '20 g', 115, 1.6, 9, 8.2, 2.2, 5],
  ['chocolat_lait', 'Chocolat au lait', 'snacks', '25 g', 134, 1.9, 14.6, 7.7, 0.6, 14],
  ['biscuit', 'Biscuit sec', 'snacks', '30 g (4 pièces)', 147, 2, 20, 6.3, 0.6, 7.5],
  ['gateau', 'Part de gâteau', 'snacks', '100 g', 350, 4.5, 45, 17, 1, 28],
  ['glace', 'Glace vanille', 'snacks', '100 g', 207, 3.5, 24, 11, 0.7, 21],
  ['chips', 'Chips', 'snacks', '30 g', 160, 1.9, 15, 10, 1.4, 0.2],
  ['cereales', 'Céréales sucrées', 'snacks', '40 g', 152, 2.8, 32, 1.2, 2, 13],
  ['miel', 'Miel', 'snacks', '1 c. à soupe (21 g)', 64, 0.1, 17, 0, 0, 17],
  ['hummus', 'Houmous', 'snacks', '50 g', 83, 2.4, 6.8, 5.3, 2, 0.4],
  ['compote', 'Compote sans sucre ajouté', 'snacks', '100 g', 68, 0.3, 16, 0.2, 1.8, 14],
  ['barre_cereales', 'Barre de céréales', 'snacks', '30 g', 128, 2, 20, 4.4, 1.3, 10],
];

export const FOODS: Food[] = ROWS.map(([id, name, cat, portion, kcal, proteinG, carbsG, fatG, fiberG, sugarG]) => ({
  id,
  name,
  cat,
  portion,
  kcal,
  proteinG,
  carbsG,
  fatG,
  fiberG,
  sugarG,
}));

/**
 * Score santé 0-4 (4 = Excellent A, 3 = Bon B, 2 = Correct C, 1 = À limiter D, 0 = À éviter E)
 * Style Yuka simplifié : base 3, +1 si riche en protéines ou fibres, -1 si trop
 * de sucres, -1 si trop gras.
 */
export function healthScore(f: Food): 0 | 1 | 2 | 3 | 4 {
  let s = 3;
  if (f.proteinG >= 12) s += 1;
  if (f.fiberG >= 4) s += 1;
  if (f.sugarG >= 12) s -= 1;
  if (f.fatG >= 18) s -= 1;
  return Math.max(0, Math.min(4, s)) as 0 | 1 | 2 | 3 | 4;
}

export const SCORE_LABEL: Record<number, { letter: string; label: string; color: string }> = {
  4: { letter: 'A', label: 'Excellent', color: '#16A34A' },
  3: { letter: 'B', label: 'Bon', color: '#84CC16' },
  2: { letter: 'C', label: 'Correct', color: '#F59E0B' },
  1: { letter: 'D', label: 'À limiter', color: '#F97316' },
  0: { letter: 'E', label: 'À éviter', color: '#EF4444' },
};

/** Conseil santé générique selon le score moyen d'un repas */
export function mealAdvice(avg: number): { title: string; text: string } {
  if (avg >= 3.5) return { title: 'Excellent choix !', text: 'Ce repas soutient votre énergie, votre récupération et votre forme. Continuez !' };
  if (avg >= 2.5) return { title: 'Bon équilibre', text: 'Un repas correct. Ajoutez une portion de légumes ou de fibres pour passer au niveau supérieur.' };
  if (avg >= 1.5) return { title: 'À rééquilibrer', text: 'Ce repas est riche en sucres ou graisses. Complétez avec des protéines maigres et des légumes.' };
  return { title: 'Attention', text: 'Ce repas est très calorique et peu nourrissant. Limitez-le aux occasions et hydratez-vous bien.' };
}

export function foodById(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id);
}
