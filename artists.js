const readline = require('readline');
const request = require('request');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

main();

async function main() {
	const artist = await getArtist();
	if (await checkExistence(artist) == true) {
		sendSongs(artist);
	} else {
		rl.setPrompt(`There are no songs in the HOT 100 by artists containing '${artist}', please try again...\n`);
		rl.prompt();
		rl.on('line', async function(userInput) {
			if (await checkExistence(userInput) == true) {
				sendSongs(userInput);
			} else {
				rl.setPrompt(`There are no songs in the HOT 100 by artists containing '${userInput}', please try again...\n`);
				rl.prompt();
			}
		});
	}
}

function getArtist() {
	return new Promise((resolve) => {
		rl.question('What artist would you like to search for in the HOT 100? You can use a full or partial name.\n', (artist) => {
			resolve(artist);
		});
	});
}

function checkExistence(artist) {
	return new Promise((resolve) => {
		request('https://www.billboard.com/charts/hot-100', function(error, response, html) {
			if (!error && response.statusCode == 200) {
				const $ = cheerio.load(html);
				$('span.chart-element__information').each(function(i, element) {
					if ($(element).find('.chart-element__information__artist').text().toUpperCase().includes(artist.toUpperCase())) {
						resolve(true);
					}
				});
				resolve(false);
			}
		});
	});
}

async function sendSongs(artist) {
	const songs = await getSongs(artist);
	const email = await getEmail(artist);
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: 'ait618bro@gmail.com',
			pass: process.env.EMAIL_PASS
		},
		tls: {
			rejectUnauthorized: false
		}
	});
	const mailoptions = {
		from: '"Aaron Gray" <ait618bro@gmail.com>',
		to: email,
		subject: `Songs in the HOT 100 by artists containing: '${artist}'`,
		text: songs.join(''),
		html: songs.join('')
	};
	transporter.sendMail(mailoptions, function(error) {
		if (error) {
			console.log('Something went wrong with Nodemailer... Check the entered email address and try again...');
			rl.close();
		} else {
			console.log('Sent!!');
			rl.close();
		}
	});
}

function getSongs(artist) {
	return new Promise((resolve) => {
		const songs = [];
		request('https://www.billboard.com/charts/hot-100', function(error, response, html) {
			if (!error && response.statusCode == 200) {
				const $ = cheerio.load(html);
				$('span.chart-element__information').each(function(i, element) {
					if ($(element).find('.chart-element__information__artist').text().toUpperCase().includes(artist.toUpperCase())) {
						songs.push(`${$(element).find('.chart-element__information__artist').text().bold()}: ${$(element).find('.chart-element__information__song').text().italics()}${'<br>'}`);
					}
				});
				resolve(songs);
			}
		});
	});
}

function getEmail(artist) {
	return new Promise((resolve) => {
		rl.question(`Success!! There are songs in the HOT 100 by artists containing '${artist}'. What email address should we send their songs to?\n`, (email) => {
			resolve(email);
		});
	});
}
