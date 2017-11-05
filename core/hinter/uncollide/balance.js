"use strict";

function canBeAdjustedUp(y, k, env, distance) {
	for (let j = k + 1; j < y.length; j++) {
		if (env.directOverlaps[j][k] && y[j] - y[k] - 1 <= distance) return false;
	}
	return true;
}
function canBeAdjustedDown(y, k, env, distance) {
	for (let j = 0; j < k; j++) {
		if (env.directOverlaps[k][j] && y[k] - y[j] - 1 <= distance) return false;
	}
	return true;
}
function spaceBelow1(env, y, k, bottom) {
	let space = y[k] - env.avails[k].properWidth - bottom;
	for (let j = k - 1; j >= 0; j--) {
		if (env.directOverlaps[k][j] && y[k] - y[j] - env.avails[k].properWidth < space)
			space = y[k] - y[j] - env.avails[k].properWidth;
	}
	return space;
}
function spaceAbove1(env, y, k, top) {
	let space = top - y[k];
	for (let j = k + 1; j < y.length; j++) {
		if (env.directOverlaps[j][k] && y[j] - y[k] - env.avails[j].properWidth < space)
			space = y[j] - y[k] - env.avails[j].properWidth;
	}
	return space;
}

function annexed(y, p, q) {
	return y[p] === y[q];
}
function colliding(y, p, q) {
	return y[p] - y[q] < 2 && y[p] - y[q] >= 1;
}
function spaced(y, p, q) {
	return y[p] - y[q] === 2;
}
function spare(y, p, q) {
	return y[p] - y[q] > 2;
}

function balanceMove(y, env) {
	const m = env.availsByLength;
	const avails = env.avails;
	let stable = true;
	for (let jm = 0; jm < y.length; jm++) {
		let j = m[jm][1];
		if (avails[j].atGlyphBottom || avails[j].atGlyphTop) continue;
		if (canBeAdjustedDown(y, j, env, 1.8) && y[j] > avails[j].low) {
			if (y[j] - avails[j].center > 0.75) {
				y[j] -= 1;
				stable = false;
			}
		} else if (canBeAdjustedUp(y, j, env, 1.8) && y[j] < avails[j].high) {
			if (avails[j].center - y[j] > 0.75) {
				y[j] += 1;
				stable = false;
			}
		}
	}
	return stable;
}

function balanceTriplets1(y, env) {
	const avails = env.avails;
	const triplets = env.triplets;
	const P = env.P;
	let stable = true;
	for (let _t = 0; _t < triplets.length; _t++) {
		const t = triplets[_t];
		const j = t[0],
			k = t[1],
			m = t[2];
		let mark = 0;
		let checkImprove = false;
		if (colliding(y, j, k) && spaced(y, k, m) && y[k] > avails[k].low) {
			mark = -1;
			checkImprove = true;
		} else if (colliding(y, k, m) && spaced(y, j, k) && y[k] < avails[k].high) {
			mark = 1;
			checkImprove = true;
		} else if (annexed(y, j, k) && spaced(y, k, m) && y[k] > avails[k].low + 1) {
			mark = -2;
			checkImprove = true;
		} else if (annexed(y, k, m) && spaced(y, j, k) && y[k] < avails[k].high - 1) {
			mark = 2;
			checkImprove = true;
		} else if (
			(colliding(y, j, k) || annexed(y, j, k)) &&
			spare(y, k, m) &&
			y[k] > avails[k].low
		) {
			mark = -1;
			if (P[k][m] < 4) checkImprove = true;
		} else if (
			(colliding(y, k, m) || annexed(y, k, m)) &&
			spare(y, j, k) &&
			y[k] < avails[k].high
		) {
			mark = 1;
			if (P[j][k] < 4) checkImprove = true;
		} else if (colliding(y, j, k) && colliding(y, k, m)) {
			if (env.A[j][k] <= env.A[k][m] && y[k] < avails[k].high) {
				mark = 1;
			} else if (env.A[j][k] >= env.A[k][m] && y[k] > avails[k].low) {
				mark = -1;
			} else if (y[k] < avails[k].high) {
				mark = 1;
			} else if (y[k] > avails[k].low) {
				mark = -1;
			}
		}
		if (checkImprove) {
			const before = env.findIndividual(y, true);
			y[k] += mark;
			const after = env.findIndividual(y, true);
			if (before.compare(after) < 0) {
				stable = false;
			} else {
				y[k] -= mark;
			}
		} else {
			y[k] += mark;
			stable = false;
		}
	}
	return stable;
}

function balanceTriplets2(y, env) {
	const avails = env.avails;
	const triplets = env.triplets;
	let stable = true;
	for (let _t = 0; _t < triplets.length; _t++) {
		const t = triplets[_t];
		const j = t[0],
			k = t[1],
			m = t[2];
		const su = spaceAbove1(env, y, k, env.glyphTopPixels + 3);
		const sb = spaceBelow1(env, y, k, env.glyphBottomPixels - 3);
		const d1 = y[j] - avails[j].properWidth - y[k];
		const d2 = y[k] - avails[k].properWidth - y[m];
		const o1 = avails[j].y0 - avails[j].w0 - avails[k].y0;
		const o2 = avails[k].y0 - avails[k].w0 - avails[m].y0;
		if (
			y[k] < avails[k].high &&
			o1 / o2 < 2 &&
			env.P[j][k] <= env.P[k][m] &&
			su > 1 &&
			(sb < 1 || d1 >= d2 * 2)
		) {
			y[k] += 1;
			stable = false;
		} else if (
			y[k] > avails[k].low &&
			o2 / o1 < 2 &&
			env.P[j][k] >= env.P[k][m] &&
			sb > 1 &&
			(su < 1 || d2 >= d1 * 2)
		) {
			y[k] -= 1;
			stable = false;
		}
	}
	return stable;
}

function balance(y, env) {
	const REBALANCE_PASSES = env.strategy.REBALANCE_PASSES;

	for (let pass = 0; pass < REBALANCE_PASSES; pass++) {
		if (balanceMove(y, env)) break;
	}
	for (let pass = 0; pass < REBALANCE_PASSES; pass++) {
		if (balanceTriplets1(y, env)) break;
	}
	for (let pass = 0; pass < REBALANCE_PASSES; pass++) {
		if (balanceTriplets2(y, env)) break;
	}
	for (let j = 0; j < y.length; j++) {
		for (let k = 0; k < j; k++) {
			if (env.symmetry[j][k] && y[j] !== y[k]) {
				y[k] = y[j];
			}
		}
	}
	return y;
}

module.exports = balance;
