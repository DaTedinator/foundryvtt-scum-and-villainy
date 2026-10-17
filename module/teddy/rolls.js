/**
 * @typedef {Object} DiceResult
 * @property {number} result
 */

/**
 * @typedef {Object} ThreatEvaluation
 * @property {number} sixes
 * @property {number} partials
 * @property {number} misses
 * @property {boolean} isCritical
 */

/**
 * Calculates stress from a Deep Cuts-style push roll.
 * @param {Array} rolls
 * @param {boolean} zeroMode
 * @returns {{stressCost: number, rollStatus: string}}
 */
export async function calculatePushRollStress( rolls, zeroMode ) {
  const sortedRolls = rolls.map(i => i.result).sort();
  if (zeroMode) {sortedRolls.shift();}
  const sixCount = sortedRolls.filter(val => val === 6).length;
  const primaryResult = sortedRolls[0];

  if (sixCount >= 2) {return {stressCost:0, rollStatus:"push-critical"};}
  if (primaryResult === 6) {return {stressCost:1, rollStatus:"push-success"};}
  if (primaryResult >= 4) {return {stressCost:2, rollStatus:"push-partial"};}
  return {stressCost:3, rollStatus:"push-failure"};
}

/**
 * Analyzes dice pool for Deep Cuts-style threat resolution.
 * @param {Array} rolls
 * @param {boolean} zeroMode
 * @returns {{sixes: number, partials: number, misses: number, isCritical: boolean}}
 */
export async function evaluateThreatRollPool (rolls, zeroMode) {
  const sortedRolls = rolls.map(i => i.result).sort();
  if (zeroMode) {sortedRolls.shift();}
  
  const sixes = sortedRolls.filter(val => val === 6).length;
  const partials = sortedRolls.filter(val => val === 4 || val === 5).length;
  const misses = sortedRolls.filter(val => val <= 3).length;

  return {
    sixes, partials, misses,
    edge: (sixes >= 2)
  }
}

/**
 * Handles execution and rendering for Deep Cuts threat rolls.
 * @param {Object} rollParameters
 * @returns {Promise<ChatMessage>}
 */
export async function executeThreatRoll({
  attribute_name="fortune",
  base_dice=0,
  threats=0,
  modifier=0
}) {
  const dicePool = base_dice + threats + modifier;
  const zeroMode = dicePool <= 0;
  const rollFormula = zeroMode ? "2d6kl" : `${dicePool}d6`;
  const diceRoll = await new Roll(rollFormula).evaluate();
  const evaluation = evaluateThreatRollPool(diceRoll.terms[0].results, zeroMode);

  const templateData = {
    is_threat_roll: true,
    threat_sixes: evaluation.sixes,
    threat_partials: evaluation.partials,
    threat_misses: evaluation.misses,
    threat_is_critical: evaluation.isCriticalSuccess,
    rolls: diceRoll.terms[0].results,
    attribute_label: rollParameters.attribute_label,
    purpose: rollParameters.purpose,
  };

  const chatContent = await renderTemplate(
    "systems/scum-and-villainy-teddy/templates/sav-roll.html",
    templateData
  );

  return diceRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: rollParameters.actor }),
    content: chatContent,
  });
}