<!--
title: Getting Started
description: Introduction to Squishy Electron
-->
<style>
	img {
		width: 36em;
		cursor: pointer;
	}
</style>
<script>

const handleClick = (ev) => {
	let img = ev.target;
	switch (img.style.width) {
		case '72em': img.style.width = '36em'; break;
		case '48em': img.style.width = '72em'; break;
		default: img.style.width = '48em';
	}
}

window.onload = () => {
	let imgs = document.body.querySelectorAll('img');
	for (let i = 0; i < imgs.length; i++) {
		let img = imgs[i];
		img.addEventListener('click', handleClick);
	}
}
</script>


# Getting Started

Squishy Electron simulates an electron, in its microscopic behavior.
To begin integration, click on the Start button in the lower left corner of the Electron Wave box.

<img src=overallApp.png />

## The Wave — The Electron

The rainbow colors show the phase of the wave,
<img src=wave1.png />

## Starting Wave

<img src=setWave.png />

## Starting Voltage

<img src=setVoltage2.png style='float: left' />
<video src=voltagePull.mp4 controls style='float: none' > </video>

You can drag the offwhite voltage line on the main wave to change the voltage shape.
Hold down shift for a straighter line.
<div style='clear: both'></div>

## Size of Space

<img src=setSpace1.png />

## Integration

Integration means solving Schrodinger's Equation for each time step, to get the shape of the electron wave.
This might be limited by how fast your machine is.
<img src=setIntegration2.png />
