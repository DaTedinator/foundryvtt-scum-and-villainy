import { executeThreatRoll } from "./rolls.js";

/**
 * Attaches method wrappers to the Actor document class for threat roll interception.
 * @returns {void}
 */
export function registerSystemOverrides() {
  const targetActorClass = CONFIG.Actor.documentClass;
  const originalRollActionPopup = targetActorClass.prototype.rollActionPopup;

  targetActorClass.prototype.rollActionPopup = async function ( attributeName ) {
    const isThreatRollActive = game.settings.get(
      "scum-and-villainy-teddy",
      "useThreatRolls"
    );

    const baseDice = this.getRollData().dice_amount[attributeName];
    let totalDice = baseDice;

    if (isThreatRollActive) {
      return executeThreatRoll({
        actor: this,
        attribute_label: attributeName,
        dice: totalDice,
        zeromode: totalDice === 0,
        //purpose: attributeType,
      });
    }

    return originalRollActionPopup.apply(this, arguments);
  };
}