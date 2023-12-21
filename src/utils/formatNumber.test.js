

// TODO make real tests out of this
// testing
//for (let ff = 1e-30;  ff < 1e30; ff *= 12345) {
//	console.log(`${ff.toPrecision(5)} = ${toSiUnits(ff, 6)}`);
//}


/* ********************************************************** put this in a spec file! */
//😇 function testThousands() {
//😇 	let n;
//😇 	for (n = 1e-6; n < 1e6; n *= 10) {
//😇 		for (let f = 1; f < 10; f *= 1.4)
//😇 			console.info(`  testThousands, progressive fractions: ${n*f} =>`, thousands(n * f));
//😇 		console.log();
//😇 	}
//😇 }
//😇testThousands();


// actually, the following is powers


// keep this!!  or even better, move to a spec file!
//😇 function testPowers() {
//😇 	for (let spdStr in stepsPerDecadeStepFactors) {
//😇 		const spd = +spdStr;
//😇 		let stepFactors = stepsPerDecadeStepFactors[spd];
//😇 		console.info(`spd: ${spd}  stepFactors:`, stepFactors.map(f => f.toFixed(2)).join(', ') );
//😇
//😇 		for (let offset = -6; offset < 6; offset += spd) {
//😇 			let totalOffset = spd*offset;
//😇 			stepFactors.forEach((factor, ixNear) => {
//😇 				let ix = ixNear + totalOffset;
//😇 				let power = indexToPower(false, stepFactors, spd, ix);
//😇 				let ixBack = powerToIndex(spd, power);
//😇 				console.info(`   ${ix} ➡︎ ${power} ➡ ${ixBack}`);
//😇 				if (ix != ixBack)
//😇 					console.error(`  ix:${ix} ≠ ixBack:${ixBack}`);
//😇 			})
//😇 		}
//😇
//😇 	}
//😇 }
//😇testPowers();



