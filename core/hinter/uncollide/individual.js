"use strict";

const DIAG_BIAS_PIXELS = 1 / 6;
const DIAG_BIAS_PIXELS_NEG = 1 / 3;
class Individual {
	constructor(y, env, unbalanced) {
		this.gene = y;
		this.unbalanced = unbalanced;
		this.collidePotential = this.getCollidePotential(env);
		this.ablationPotential = this.getAblationPotential(env);
		this.fitness = this.getFitness();
	}
	getFitness() {
		return 1 / (1 + Math.max(0, this.collidePotential * 8 + this.ablationPotential / 16));
	}
	getCollidePotential(env) {
		const y = this.gene;
		const A = env.A,
			C = env.C,
			S = env.S,
			P = env.P,
			n = y.length,
			avails = env.avails,
			sym = env.symmetry;
		let p = 0;
		for (let j = 0; j < n; j++) {
			for (let k = 0; k < j; k++) {
				if (y[j] === y[k]) {
					p += A[j][k]; // Alignment
				} else if (y[j] <= y[k] + env.avails[j].properWidth) {
					p += C[j][k]; // Collide
				}
				if (
					avails[j].rid &&
					avails[j].rid === avails[k].rid &&
					(y[j] - y[k] > Math.ceil(avails[j].y0px - avails[k].y0px + DIAG_BIAS_PIXELS) ||
						y[j] - y[k] <
							Math.ceil(avails[j].y0px - avails[k].y0px - DIAG_BIAS_PIXELS_NEG))
				) {
					p += S[j][k]; // diagonal break
				}
				if (j !== k && sym[j][k]) {
					if (y[j] !== y[k]) {
						p += S[j][k]; // Symmetry break
					}
				} else {
					if (y[j] < y[k]) {
						p += S[j][k]; // Swap
					} else if (
						avails[j].y0 - avails[j].w0 < avails[k].y0 &&
						!(avails[j].rid && avails[j].rid === avails[k].rid) &&
						(avails[j].properWidth > 1
							? y[j] - avails[j].properWidth >= y[k]
							: y[j] - avails[j].properWidth > y[k])
					) {
						// Swap
						// higher stroke being too high for original outline designed like this ↓
						// ------.
						//       |   ,-------
						// ------'   |
						//           `-------
						p += S[j][k];
					}
				}
			}
		}
		return p;
	}
	getAblationPotential(env) {
		if (env.noAblation) return 0;
		const y = this.gene;
		const avails = env.avails,
			triplets = env.triplets,
			uppx = env.uppx,
			n = y.length;
		let p = 0;
		for (let j = 0; j < y.length; j++) {
			p += avails[j].ablationCoeff * uppx * Math.abs(y[j] - avails[j].center);
			if (y[j] > avails[j].softHigh) {
				p +=
					env.strategy.COEFF_PORPORTION_DISTORTION *
					uppx *
					Math.min(1, y[j] - avails[j].softHigh);
			}
			if (y[j] < avails[j].softLow) {
				p +=
					env.strategy.COEFF_PORPORTION_DISTORTION *
					uppx *
					Math.min(1, avails[j].softHigh - y[j]);
			}
		}

		const finelimit = uppx / 8;
		const dlimit = uppx / 3;
		const dlimitx = 2 * uppx / 3;
		const compressLimit = 3 * uppx / 4;
		for (let [j, k, w, d1, d2] of triplets) {
			const d = d1 - d2;
			if (!(y[j] > y[k] && y[k] > y[w])) continue;
			const spacejk = y[j] - y[k] - avails[j].properWidth;
			const spacekw = y[k] - y[w] - avails[k].properWidth;
			const expanded =
				spacejk * uppx > d1 + compressLimit && spacekw * uppx > d2 + compressLimit;
			const compressed =
				spacejk * uppx < d1 - compressLimit && spacekw * uppx < d2 - compressLimit;
			if (
				(d >= dlimitx && spacejk <= spacekw) ||
				(d >= dlimit && spacejk < spacekw) ||
				(d <= -dlimitx && spacejk >= spacekw) ||
				(d <= -dlimit && spacejk > spacekw) ||
				(d < dlimit && d > -dlimit && (spacejk - spacekw > 1 || spacejk - spacekw < -1)) ||
				(d < dlimit && d > -dlimit && (compressed || expanded))
			) {
				p += (env.C[j][k] + env.C[k][w]) * env.strategy.COEFF_DISTORT;
			}
			if (d < finelimit && d > -finelimit && spacejk !== spacekw) {
				p += (env.C[j][k] + env.C[k][w]) * env.strategy.COEFF_DISTORT / 3;
			}
		}
		return p;
	}
}

module.exports = Individual;
