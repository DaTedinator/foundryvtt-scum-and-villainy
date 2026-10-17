import { SaVHelpers } from "../sav-helpers.js";
import { executeThreatRoll } from "./rolls.js";

function rollModifiersSection(base_dice=0, {
    threats=false,
    modifiers=true,
    desperateBox=false,
}) {
    const divArray = [
        `
        <div class="form-group roll base-dice">
            <label class="base-dice">${ game.i18n.localize( 'BITD.BaseDice' ) }: </label>
            <label>${ base_dice }d</label>
        </div>
        `
    ];

    if (threats) {
        divArray.push(`
            <div class="form-group roll mod" id="roll-threats">
                <label for="threats">${ game.i18n.localize( 'BITD.Threats' ) }:</label>
                <select class="dice-modifier" id="threats" name="threats">
                    <option value="0" selected>One</option>
                    <option value="1">Two</option>
                    <option value="2">Three</option>
                </select>
            </div>
        `)
    }

    if (modifiers) {
        divArray.push(`
            <div class="form-group roll mod" id="roll-modifiers">
                <label for="mod">${ game.i18n.localize( 'BITD.Modifier' ) }:</label>
                <select class="dice-modifier" id="mod" name="mod">
                    <option value="-3">-3d</option>
                    <option value="-2">-2d</option>
                    <option value="-1">-1d</option>
                    <option value="0" selected>+0d</option>
                    <option value="1">+1d</option>
                    <option value="2">+2d</option>
                    <option value="3">+3d</option>
                </select>
            </div>
        `)
    }

    if (desperateBox) {
        divArray.push(`
            <div class="form-group roll box" id="roll-desperate">
                <label for="desperate">${ game.i18n.localize( 'BITD.PositionDesperate' ) }:</label>
                <input type="checkbox" id="desperate" name="desperate" value="true">
            </div>
        `)
    }

    divArray.push(`
        <div class="form-group roll total-rolled">
            <label class="total-rolled">${ game.i18n.localize( 'BITD.TotalDice' ) }: </label>
            <label id="total-dice">${ base_dice }d</label>
        </div>
    `)

    return `<form data-base-dice="${ base_dice }">${divArray.join(`\n`)}</form>`
}

export async function threatRollPopup(actor, attribute_name) {
    let attribute_label = SaVHelpers.getAttributeLabel(attribute_name);

    // Calculate Dice Amount for Attributes
    const base_dice = actor.getRollData().dice_amount[attribute_name];

    return {
        title: `${ game.i18n.localize( 'BITD.Roll' ) } ${ game.i18n.localize( attribute_label ) }`,
        content: `
        <div class="scum-and-villainy-teddy" id="threat-roll">
            <h2>${ game.i18n.localize( 'BITD.Roll' ) } ${ game.i18n.localize( attribute_label ) } (${ total_dice }d)</h2>
            ${rollModifiersSection(base_dice,{threats:true,desperateBox:true})}
        </div>
        `,
        buttons: {
            yes: {
                icon: "<i class='fas fa-check'></i>",
                label: game.i18n.localize( 'BITD.Roll' ),
                callback: async( html ) => {
                    const isDesperate = html.find(`[name=desperate]`)[0].is(':checked');
                    const threats = parseInt( html.find(`[name="threats"]`)[0].value );
                    const modifier = parseInt( html.find(`[name="mod"]`)[0].value );

                    const rollParameters = {attribute_name, base_dice, threats, modifier}

                    if (isDesperate) {await executeDesperateRoll(rollParameters);}
                    else {await executeThreatRoll(rollParameters);}
                }
            },
            no: {
                icon: "<i class='fas fa-times'></i>",
                label: game.i18n.localize( 'BITD.Cancel' ),
            },
        },
        default: "yes",
        render: html => {
            async function _onDiceChange( event ) {
                const $form =$(this).closest("form");
                const baseDice = parseInt($form.data("baseDice")) || 0;

                let totalMod = 0;
                $form.find(".dice-modifier").each(function() {
                    totalMod += parseInt(this.value) || 0;
                });

                const finalPool = baseDice + totalMod;

                $form.find(".total-rolled label:nth-child(2)").text(`${finalPool}d`);
            }
            html.find( ".dice-modifier" ).on("change", _onDiceChange);
        }
    }
}