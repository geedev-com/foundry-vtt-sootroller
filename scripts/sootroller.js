import {DieSoot} from './diesoot.js';

class Roller {

  /**
  * Create popup for roller
  * @return none
  */
  async SootRollerPopup() {

    const maxDice = game.settings.get("foundryvtt-sootroller", "maxDiceCount");
    const defaultDice = game.settings.get("foundryvtt-sootroller", "defaultDiceCount") + 1;

    new Dialog({
      title: `${game.i18n.localize('SootRoller.RollTitle')}`,
      content: `
        <h2>${game.i18n.localize('SootRoller.Roll')}</h2>
        <form>
          <div class="form-group">
            <label>${game.i18n.localize('SootRoller.RollNumberOfDice')}:</label>
            <select id="dice" name="dice">
              ${Array(maxDice + 1).fill().map((item, i) => `<option value="${i}">${i}d</option>`).join('')}
            </select>
            <script>$('#dice option[value="' + game.settings.get("foundryvtt-sootroller", "defaultDiceCount") + '"]').prop("selected", "selected");</script>
          </div>
          <div class="form-group">
            <label>${game.i18n.localize('SootRoller.Difficulty')}:</label>
            <select id="diff" name="diff">
              <option value="1">${game.i18n.localize('SootRoller.Difficulty1')}</option>
              <option value="2">${game.i18n.localize('SootRoller.Difficulty2')}</option>
              <option value="3">${game.i18n.localize('SootRoller.Difficulty3')}</option>
              <option value="4">${game.i18n.localize('SootRoller.Difficulty4')}</option>
              <option value="5">${game.i18n.localize('SootRoller.Difficulty5')}</option>
              <option value="6">${game.i18n.localize('SootRoller.Difficulty6')}</option>
            </select>
            <script>$('#diff option[value="' + game.settings.get("foundryvtt-sootroller", "defaultDifficulty") + '"]').prop("selected", "selected");</script>
          </div>
          <div class="form-group">
            <label>${game.i18n.localize('SootRoller.Opposition')}:</label>
            <select id="opp" name="opp">
              <option value="0">${game.i18n.localize('SootRoller.None')}</option>
              <option value="1">1d</option>
              <option value="2">2d</option>
              <option value="3">3d</option>
              <option value="4">4d</option>
              <option value="5">5d</option>
              <option value="6">6d</option>
              <option value="7">7d</option>
              <option value="8">8d</option>
              <option value="9">9d</option>
              <option value="10">10d</option>
            </select>
            <script>$('#opp option[value="0"]').prop("selected", "selected");</script>
          </div>
        </form>
      `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize('SootRoller.Roll'),
          callback: async (html) =>
          {
            const dice_amount = parseInt(html.find('[name="dice"]')[0].value);
            const difficulty = html.find('[name="diff"]')[0].value;
            const opposition = html.find('[name="opp"]')[0].value;
            await this.SootRoller("", dice_amount, difficulty, opposition);
          }
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize('SootRoller.Close'),
        },
      },
      default: "yes",
    }).render(true);
  }


  /**
   * Roll Dice.
   * 
   * @param {string} attribute arbitrary label for the roll
   * @param {int} dice_amount number of dice to roll
   * @param {int} difficulty difficulty
   */
  async SootRoller(attribute = "", dice_amount = 0, difficulty = 2, opposition = 0) {
    let versionParts;
    if( game.version ) {
      versionParts = game.version.split( '.' );
      game.majorVersion = parseInt( versionParts[0] );
      game.minorVersion = parseInt( versionParts[1] );
    } else {
      versionParts = game.data.version.split( '.' );
      game.majorVersion = parseInt( versionParts[1] );
      game.minorVersion = parseInt( versionParts[2] );
    }

    // prepare and roll dice

    if (dice_amount < 1) { dice_amount = 1; }

    let opposition_dice_amount = dice_amount;
    if(opposition > 0){opposition_dice_amount = opposition};
  
    const r = new Roll(`${dice_amount}ds`, {});
    const rOpp = new Roll(`${opposition_dice_amount}ds`, {});

    if (game.majorVersion > 7) {
      await r.evaluate({async: true});
      await rOpp.evaluate({async: true});
    } else {
      r.roll();
      rOpp.roll();
    }
    return await this.showChatRollMessage( r, rOpp, attribute, difficulty, opposition );
  }

  /**
   * Shows Chat message.
   *
   * @param {Roll} r array of rolls
   * @param {string} attribute arbitrary label for the roll
   * @param {int} difficulty difficulty
   */
  async showChatRollMessage(r, rOpp, attribute = "", difficulty = 0, opposition = 0) {
    let versionParts;
    if( game.version ) {
      versionParts = game.version.split( '.' );
      game.majorVersion = parseInt( versionParts[0] );
      game.minorVersion = parseInt( versionParts[1] );
    } else {
      versionParts = game.data.version.split( '.' );
      game.majorVersion = parseInt( versionParts[1] );
      game.minorVersion = parseInt( versionParts[2] );
    }

    const speaker = ChatMessage.getSpeaker();

    // color
    let color = game.settings.get("foundryvtt-sootroller", "backgroundColor");

    // roll results
    let rolls = [];
    rolls = (r.terms)[0].results;
    let success_count = this.getSootActionRollCount(rolls);

    let oppRolls = [];
    oppRolls = (rOpp.terms)[0].results;
    let opposition_success_count = this.getSootActionRollCount(oppRolls);

    let label_text = "Rolled " + rolls.length + "d for " + success_count + " successes";
    let result_message = "";
    let result_margin = 0;

    if(opposition > 0){
      label_text += "<br />vs Opposition's " + opposition + "d for " + opposition_success_count + " successes";
      
      let opposition_difficulty = difficulty - game.settings.get("foundryvtt-sootroller", "defaultDifficulty");
      if (result_margin != 0){ label_text += "(/" + result_margin + ")";}
      
      result_margin = success_count - opposition_success_count - opposition_difficulty;
      result_message = game.i18n.localize('SootRoller.ResultMessageLose')+ " (" + result_margin + ")";
      if(result_margin == 0){ 
        result_message = game.i18n.localize('SootRoller.ResultMessageTie'); 
      }
      if(result_margin > 0){
        result_message = game.i18n.localize('SootRoller.ResultMessageWin') + " (+" + result_margin + ")"; 
      }

    } else {
      label_text += " vs Difficulty " + difficulty;

      result_margin = success_count - difficulty;
      result_message = game.i18n.localize('SootRoller.ResultMessageLess');
      if(result_margin == 0){ 
        result_message = game.i18n.localize('SootRoller.ResultMessageSame'); 
      }
      if(result_margin > 0){
        result_message = game.i18n.localize('SootRoller.ResultMessageMore') + " (+" + result_margin + ")"; 
      }
      //clear oppRolls
      oppRolls = [];
    }

    const result = await renderTemplate("modules/foundryvtt-sootroller/templates/soot-roll.html", { rolls, oppRolls, label_text, attribute, result_message, color });

    const messageData = {
      speaker,
      content: result,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: r
    };
    if (game.majorVersion > 7) {
      return CONFIG.ChatMessage.documentClass.create(messageData, {});
    } else {
      return CONFIG.ChatMessage.entityClass.create(messageData, {});
    }
  }

  /**
   *  Get the number of successes.
   * 
   * @param {Array} rolls results of dice rolls
   * @returns {int} number of successes
   */
  getSootActionRollCount(rolls) {

    let sorted_rolls = [];
    // Sort roll values from lowest to highest.
    sorted_rolls = rolls.map((i) => i.result).sort();

    let filtered = sorted_rolls.filter(function(item) {
      return item >= 4;
    });

    return filtered.length;
  }
} 
//end class

Hooks.once("ready", () => {
	game.sootroller = new Roller();
});

// getSceneControlButtons
Hooks.on("renderSceneControls", (app, html) => {
  const dice_roller = $('<li class="scene-control" title="Soot Roller"><i class="fas fa-dice"></i></li>');
  dice_roller.on( "click", async function() {
    await game.sootroller.SootRollerPopup();
  })
  if( isNewerVersion( game.version, '9.220' ) ) {
    html.children().first().append( dice_roller );
  } else {
    html.append( dice_roller );
  }
});

// Die Soot hooks

Hooks.once("init", async function () {
  CONFIG.Dice.terms["s"] = DieSoot;
});

Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({id:"diesoot",name:"DieSoot"},true);
  dice3d.addDicePreset({
    type:"ds",
    labels:[
      'modules/foundryvtt-sootroller/artwork/soot-d6-1.png',
      'modules/foundryvtt-sootroller/artwork/soot-d6-2.png',
      'modules/foundryvtt-sootroller/artwork/soot-d6-3.png',
      'modules/foundryvtt-sootroller/artwork/soot-d6-4.png',
      'modules/foundryvtt-sootroller/artwork/soot-d6-5.png',
      'modules/foundryvtt-sootroller/artwork/soot-d6-6.png'
    ],
    system: "diesoot"
  });
});

// Hooks.on('diceSoNiceRollComplete', (chatMessageID) => {
//   let message = game.messages.get(chatMessageID);
//   if(message.isAuthor){
//       let success = 0;
//       let szRoll = false;
//       message.roll.dice.forEach(dice => {
//           if(dice instanceof DieSoot){
//               szRoll = true;
//               dice.results.forEach(res => {
//                   switch(res.result){
//                       case 6:
//                         success++;
//                         break;
//                       case 5:
//                         success++;
//                         break;
//                       case 4:
//                         success++;
//                         break;
//                       default:
//                         break;
//                   }
//               });
//           }
//       });
      
//       if(szRoll){
//           ChatMessage.create({
//               content: `<b>Total Successes:</b> ${success}`,
//               whisper: message.data.whisper,
//               blind: message.data.blind
//           });
//       }
//   }
// });

Hooks.once("init", () => {
  game.settings.register("foundryvtt-sootroller", "backgroundColor", {
    "name": game.i18n.localize("SootRoller.backgroundColorName"),
    "hint": game.i18n.localize("SootRoller.backgroundColorHint"),
    "scope": "world",
    "config": true,
    "choices": {
      "gray": game.i18n.localize("SootRoller.backgroundColorGray"),
      "black": game.i18n.localize("SootRoller.backgroundColorBlack")
    },
    "default": "gray",
    "type": String
  });

  game.settings.register("foundryvtt-sootroller", "maxDiceCount", {
		"name": game.i18n.localize("SootRoller.maxDiceCountName"),
		"hint": game.i18n.localize("SootRoller.maxDiceCountHint"),
		"scope": "world",
		"config": true,
		"default": 12,
		"type": Number
	});

	game.settings.register("foundryvtt-sootroller", "defaultDiceCount", {
		"name": game.i18n.localize("SootRoller.defaultDiceCountName"),
		"hint": game.i18n.localize("SootRoller.defaultDiceCountHint"),
		"scope": "world",
		"config": true,
		"default": 3,
		"type": Number
	});

  game.settings.register("foundryvtt-sootroller", "defaultDifficulty", {
		"name": game.i18n.localize("SootRoller.defaultDifficultyName"),
		"hint": game.i18n.localize("SootRoller.defaultDifficultyHint"),
		"scope": "world",
		"config": true,
		"default": "2",
    "type": Number
	});

	// game.settings.register("foundryvtt-sootroller", "defaultOpposition", {
	// 	"name": game.i18n.localize("SootRoller.defaultOppositionName"),
	// 	"hint": game.i18n.localize("SootRoller.defaultOppositionHint"),
	// 	"scope": "world",
	// 	"config": true,
	// 	"default": "0",
  //   "type": Number
	// });
});

console.log("SootRoller | Soot Dice Roller loaded");
