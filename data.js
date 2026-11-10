const CROPS = {
  wheat:  { name: 'قمح',   emoji: '🌾', level: 1, seedCost: 5,  growTime: 30,  sellPrice: 12,  xp: 5  },
  tomato: { name: 'طماطة', emoji: '🍅', level: 3, seedCost: 15, growTime: 60,  sellPrice: 40,  xp: 12 },
  corn:   { name: 'ذرة',   emoji: '🌽', level: 5, seedCost: 30, growTime: 120, sellPrice: 80,  xp: 25 }
};

const ANIMALS = {
  chicken: { name: 'دجاجة', emoji: '🐔', level: 1, cost: 50,  feedCost: 1, produceTime: 60,  product: 'egg',  xp: 8  },
  cow:     { name: 'بقرة',  emoji: '🐄', level: 5, cost: 200, feedCost: 2, produceTime: 120, product: 'milk', xp: 15 }
};

const FACTORIES = {
  feedMill: { name: 'مطحنة أعلاف', emoji: '⚙️', level: 2, cost: 100 },
  bakery:   { name: 'مخبز',        emoji: '🍞', level: 4, cost: 300 },
  dairy:    { name: 'معمل ألبان',  emoji: '🥛', level: 6, cost: 500 }
};

const RECIPES = {
  feedMill: { input: { wheat: 1 }, output: 'feed',   outputQty: 1, time: 10, xp: 3  },
  bakery:   { input: { wheat: 3 }, output: 'bread',  outputQty: 1, time: 20, xp: 8  },
  dairy:    { input: { milk: 2 },  output: 'cheese', outputQty: 1, time: 30, xp: 12 }
};

const ITEMS = {
  wheat:  { name: 'قمح',   emoji: '🌾', sellPrice: 12  },
  tomato: { name: 'طماطة', emoji: '🍅', sellPrice: 40  },
  corn:   { name: 'ذرة',   emoji: '🌽', sellPrice: 80  },
  egg:    { name: 'بيضة',  emoji: '🥚', sellPrice: 25  },
  milk:   { name: 'حليب',  emoji: '🥛', sellPrice: 50  },
  feed:   { name: 'علف',   emoji: '🍃', sellPrice: 5   },
  bread:  { name: 'خبز',   emoji: '🍞', sellPrice: 45  },
  cheese: { name: 'جبن',   emoji: '🧀', sellPrice: 130 }
};

const LEVELS = {
  1: { xpNeeded: 0,    unlocks: [] },
  2: { xpNeeded: 30,   unlocks: ['factory:feedMill'] },
  3: { xpNeeded: 80,   unlocks: ['crop:tomato'] },
  4: { xpNeeded: 200,  unlocks: ['factory:bakery'] },
  5: { xpNeeded: 500,  unlocks: ['crop:corn', 'animal:cow'] },
  6: { xpNeeded: 1000, unlocks: ['factory:dairy'] }
};

function getLevelFromXp(xp) {
  let lvl = 1;
  for (const [l, d] of Object.entries(LEVELS)) {
    if (xp >= d.xpNeeded) lvl = parseInt(l);
  }
  return lvl;
}
