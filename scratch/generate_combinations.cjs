const fs = require('fs');

const allGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Slots for the 3rds are the group winners they will face.
// Assuming the 8 group winners that face 3rds are: A, B, C, D, E, F, I, J (from standard bracket)
const winnerSlots = ['A', 'C', 'E', 'I', 'B', 'D', 'F', 'J'];

// Helper to get combinations
function getCombinations(arr, k) {
  if (k === 1) return arr.map(e => [e]);
  const combs = [];
  arr.forEach((e, i) => {
    const smallerCombs = getCombinations(arr.slice(i + 1), k - 1);
    smallerCombs.forEach(smallerComb => {
      combs.push([e].concat(smallerComb));
    });
  });
  return combs;
}

const combinations = getCombinations(allGroups, 8);

function findValidAssignment(combination, slots) {
  const result = [];
  const used = new Array(combination.length).fill(false);

  function backtrack(slotIndex) {
    if (slotIndex === slots.length) {
      return true; // found assignment
    }
    const currentSlot = slots[slotIndex];
    
    for (let i = 0; i < combination.length; i++) {
      if (!used[i] && combination[i] !== currentSlot) {
        used[i] = true;
        result[slotIndex] = combination[i];
        if (backtrack(slotIndex + 1)) return true;
        used[i] = false;
      }
    }
    return false;
  }

  if (backtrack(0)) {
    return result;
  }
  return null;
}

const mapping = {};

combinations.forEach(comb => {
  const key = comb.join(''); // e.g. "ABCDEFGH"
  const assignment = findValidAssignment(comb, winnerSlots);
  if (!assignment) {
    console.error("No valid assignment for", key);
  } else {
    // map the slot to the third
    mapping[key] = {};
    winnerSlots.forEach((slot, idx) => {
      mapping[key][`W${slot}`] = assignment[idx];
    });
  }
});

fs.writeFileSync('d:/Trabajo/Proyectos/Mundial2026/src/utils/fifa_combinations.json', JSON.stringify(mapping, null, 2));
console.log(`Generated ${Object.keys(mapping).length} combinations.`);
