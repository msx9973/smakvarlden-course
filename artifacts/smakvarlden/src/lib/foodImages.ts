const recipeImages: Record<string, string> = {
  "linguine med räkor och citron": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80",
  "långbakad högrev med rotfrukter": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  "torskrygg med brynt smör": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80",
  "svamprisotto med parmesan": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=900&q=80",
  "kycklingsallad med citronvinägrett": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "pannkaka med lingon och grädde": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80",
};

const ingredientImages: Record<string, string> = {
  "högrev": "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=500&q=80",
  "kycklinglår": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=500&q=80",
  "torskrygg": "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&w=500&q=80",
  "räkor skalade": "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=500&q=80",
  "smör": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80",
  "vispgrädde": "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80",
  "parmesan": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=500&q=80",
  "ägg": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=500&q=80",
  "potatis": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80",
  "morot": "https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=500&q=80",
  "gul lök": "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=500&q=80",
  "tomat": "https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=500&q=80",
  "blandad sallad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80",
  "champinjoner": "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=500&q=80",
  "lingon": "https://images.unsplash.com/photo-1563746924237-f81657b6ef72?auto=format&fit=crop&w=500&q=80",
  "vetemjöl": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80",
  "pasta linguine": "https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=500&q=80",
  "arborioris": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=500&q=80",
  "olivolja": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80",
  "rapsolja": "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=500&q=80",
  "dill": "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=500&q=80",
  "timjan": "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=500&q=80",
  "citron": "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=500&q=80",
  "vitt vin matlagning": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=500&q=80",
};

const categoryImages: Record<string, string> = {
  "Huvudrätter": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  "Sallader": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "Vegetariskt": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=900&q=80",
  "Desserter": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
  "Kött": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
  "Fisk & skaldjur": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80",
  "Mejeri": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=80",
  "Grönsaker": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80",
};

export function getRecipeImage(name: string, category?: string) {
  return recipeImages[name.toLowerCase()] ?? (category ? categoryImages[category] : undefined) ?? categoryImages["Huvudrätter"];
}

export function getIngredientImage(name: string, category?: string) {
  return ingredientImages[name.toLowerCase()] ?? (category ? categoryImages[category] : undefined) ?? categoryImages["Grönsaker"];
}
