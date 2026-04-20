/*
** waveContext -- info shared between the vista and view in yhr vonyrcy
** Copyright (C) 2026-2026 Tactile Interactive, all rights reserved
*/

// TODO: rename this from Context to Shared, everywhere


// this should only run once, indirectly called by the squish panel
// set up part of the context: waveView also covers waveVista
// shared between View and Vista somehow
function setUpContext(space, context, setWVContext) {
	debugger;  // this is never called, right?  apr 2026 TODO
	// need BOTH context  and the space.  So this is called twice.
	if (!context) {
		// not ready yet so try again
		setTimeout(setUpContext, 100, space, context, setWVContext);
		return;
	}

	let wv = context.WaveView;  // empty as created on SquishPanel
	if (wv && wv.grinder)
		return;  // already done


	wv = {
		space: space,
		grinder: space.grinder,

		// somebody's going to want to see both at once.  someday...
		show2D: getASetting('miscSettings', 'show2D'),
		show3D: getASetting('miscSettings', 'show3D'),

		mainVDisp: space.vDisp,
	};



	setWVContext(wv, space, );

		// make room for the bumpers for WELL continuum (both sides).  Note that
		// continuum can change only when page reloads.
	//wv.bumperWidth = (qeConsts.contWELL == space.continuum)
	//	? WELL_BUMPER_WIDTH
	//	: 0;

	//wv.mainVDisp = space.vDisp;

	if (traceContext) {
		// Note: the state won't kick in until next render
		console.log(`🏄 WaveVista setUpContext context:`,
			context.setShouldBeIntegrating,
			context.controlPanel,
			context.WaveVista,
		);
	}
	return;  // done
}


	// set up  WaveVista and engine
function handleSpacePromise(space, animator, context, setWVContext) {
	//debugger;
	// this will kick off a render, now that the avatar is in place
	//this.setState({space});
	//this.space = space;  // for immediate access
	//this.grinder = space.grinder;

	if (animator && !animator.grinder)
		animator.grinder = space.grinder;

	//this.mainVDisp = space.vDisp;

	setUpContext(space, context, setWVContext);
}


export function waitForSpaceCreatedPromise(animator, context, setWVContext) {
	// this triggers after C++ is up, and results in the FIRST space
	// being created.  All other spaces who .then() it can go and
	// construct
	context.spacePromise.then(
		space => {
		    dblog(`yes context.spacePromise is being thenned`)
			handleSpacePromise(space, animator, context, setWVContext);
			//debugger;
		},

		// catch
		ex => {
			console.error(`spaceCreatedProm failed:`, ex.stack ?? ex.message ?? ex);
			debugger;
		}
	);

}
