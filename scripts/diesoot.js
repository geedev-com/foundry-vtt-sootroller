export class DieSoot extends Die {
    constructor(termData) {
        termData.faces=6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = "s";

    /** @override */
    get total(){    
        // count successes (4,5,6)

        let filtered = this.results.filter(function(item) {
          return item.result >= 4;
        });

        return filtered.length;
    }

    /* -------------------------------------------- */

    /** @override */
    getResultLabel(result) {
        return {
			"1": '<img src="modules/foundryvtt-sootroller/artwork/soot-d6-1.png" />',
            "2": '<img src="modules/foundryvtt-sootroller/artwork/soot-d6-2.png" />',
            "3": '<img src="modules/foundryvtt-sootroller/artwork/soot-d6-3.png" />',
            "4": '<img src="modules/foundryvtt-sootroller/artwork/soot-d6-4.png" />',
			"5": '<img src="modules/foundryvtt-sootroller/artwork/soot-d6-5.png" />',			
            "6": '<img src="modules/foundryvtt-sootroller/artwork/soot-d6-6.png" />'
        }[result.result];
    }
}