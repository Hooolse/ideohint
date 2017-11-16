"use strict";

const roundings = require("../support/roundings");
const { xclamp, toVQ } = require("../support/common");

const STRICT_CUTOFF = 1 / 8;

function decideDelta(gear, original, target, upm, ppem) {
	return Math.round(gear * (target - original) / (upm / ppem));
}

/**
 * Decide the delta of a link
 * @param {number} gear 
 * @param {number} sign 
 * @param {boolean} isHard 
 * @param {boolean} isStacked 
 * @param {number} base0 
 * @param {number} dist0 
 * @param {number} base1 
 * @param {number} dist1 
 * @param {number} upm 
 * @param {number} ppem 
 * @param {number} addpxs 
 */
function decideDeltaShift(
	gear,
	sign,
	isHard,
	isStacked,
	base0,
	dist0,
	base1,
	dist1,
	upm,
	ppem,
	addpxs,
	swcfg
) {
	const { minSW, maxOverflow, maxShrink } = swcfg || {};
	const uppx = upm / ppem;
	const y1 = base0 + sign * dist0;
	const y2 = base1 + sign * dist1;
	const yDesired = isStacked ? base1 : base1 + sign * dist0;
	const deltaStart = Math.round(gear * (y2 - y1) / uppx);
	const deltaDesired = Math.round(gear * (yDesired - y1) / uppx);
	let delta = deltaStart - deltaDesired;
	// We will try to reduce delta to 0 when there is "enough space".
	while (delta) {
		const delta1 = delta > 0 ? delta - 1 : delta + 1;
		const y2a = y1 + (deltaDesired + delta1) * uppx / gear;
		const d = Math.abs(base1 - y2a);
		if (!isStacked && d < (minSW || 0) * uppx) break;
		if (roundings.rtgDiff(y2, base1, upm, ppem) !== roundings.rtgDiff(y2a, base1, upm, ppem))
			break; // wrong pixel!
		// if (Math.abs(y2a - roundings.rtg(y2, upm, ppem)) > ROUNDING_CUTOFF * uppx) break;
		if (
			isHard &&
			!isStacked &&
			(sign > 0 || Math.abs(y2a - roundings.rtg(y2, upm, ppem)) > STRICT_CUTOFF * uppx)
		)
			break;
		if (
			!isStacked &&
			Math.abs(y2a - base1) - Math.abs(y2 - base1) > (maxOverflow || 1 / 2) * uppx
		)
			break;
		if (
			!isStacked &&
			Math.abs(y2 - base1) - Math.abs(y2a - base1) > (maxShrink || 1 / 2) * uppx
		)
			break;
		delta = delta > 0 ? delta - 1 : delta + 1;
	}
	return delta + deltaDesired + Math.floor(addpxs * gear * xclamp(0, 8 / ppem, 1 / 2)) * sign;
}

exports.decideDelta = decideDelta;
exports.decideDeltaShift = decideDeltaShift;

exports.getSWCFG = function(ctx, darkness, ppem) {
	return {
		minSW: toVQ(ctx.minSW || 3 / 4, ppem) * darkness,
		maxOverflow: xclamp(1 / 32, toVQ(ctx.maxSWOverflowCpxs || 50, ppem) / 100, 1 / 2),
		maxShrink: xclamp(1 / 32, toVQ(ctx.maxSWShrinkCpxs || 50, ppem) / 100, 1 / 2)
	};
};
