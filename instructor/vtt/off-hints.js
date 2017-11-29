"use strict";

function queryExtrema(contours) {
	let n = 0;
	let ans = [];
	for (let c of contours) {
		for (let z of c) {
			z.id = n;
			n++;
		}
	}
	for (let _c of contours) {
		const c = [..._c];
		c[-1] = _c[_c.length - 1];
		c[_c.length] = _c[0];
		for (let j = 0; j < _c.length; j++) {
			const zp = c[j - 1];
			const z = c[j];
			const zn = c[j + 1];
			if (z.y < zp.y && z.y <= zn.y) {
				ans.push(z);
			}
			if (z.y > zp.y && z.y >= zn.y) {
				ans.push(z);
			}
		}
	}
	return ans;
}
module.exports = function formOffhints(contours, elements) {
	if (!contours) return;
	const extrema = queryExtrema(contours).sort((a, b) => a.y - b.y);
	if (elements.length) {
		let topZs = [],
			bottomZs = [];
		const topC = elements[elements.length - 1];
		const bottomC = elements[0];
		for (let z of extrema) {
			if (topC.above(z)) {
				topZs.push(z);
			} else if (bottomC.below(z)) {
				bottomZs.push(z);
			}
		}

		topZs = topZs.sort((a, b) => b.y - a.y);
		bottomZs = bottomZs.sort((a, b) => a.y - b.y);
		if (topZs.length) {
			if (topZs[0].y - topC.pOrg < this.upm / 8) {
				this.talk(`YShift(${topC.ipz},${topZs[0].id})`);
			} else if (topZs[0].y - topC.pOrg < this.upm / 3) {
				this.talk(`YDist(${topC.ipz},${topZs[0].id})`);
			} else {
				this.talk(`YAnchor(${topZs[0].id})`);
			}
			if (topZs.length > 1)
				this.talk(
					`YInterpolate(${topC.ipz},${topZs
						.slice(1)
						.map(z => z.id)
						.join(",")},${topZs[0].id})`
				);
		}
		if (bottomZs.length) {
			if (bottomC.pOrg - bottomZs[0].y < this.upm / 8) {
				this.talk(`YShift(${bottomC.ipz},${bottomZs[0].id})`);
			} else if (bottomC.pOrg - bottomZs[0].y < this.upm / 3) {
				this.talk(`YDist(${bottomC.ipz},${bottomZs[0].id})`);
			} else {
				this.talk(`YAnchor(${bottomZs[0].id})`);
			}
			if (bottomZs.length > 1)
				this.talk(
					`YInterpolate(${bottomC.ipz},${bottomZs
						.slice(1)
						.map(z => z.id)
						.join(",")},${bottomZs[0].id})`
				);
		}
	} else if (extrema.length >= 2) {
		this.talk(`YAnchor(${extrema[0].id})`);
		this.talk(`YDist(${extrema[0].id},${extrema[extrema.length - 1].id})`);
		if (extrema.length > 2) {
			this.talk(
				`YInterpolate(${extrema[0].id},${extrema
					.slice(1, -1)
					.map(z => z.id)
					.join(",")},${extrema[extrema.length - 1].id})`
			);
		}
	}
};
