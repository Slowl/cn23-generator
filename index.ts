import { appendFile, existsSync, mkdir, readFile } from 'node:fs';
import type { CustomersType } from './config/customersType.ts';
import defaultConfiguration from './config/default.json' assert { type: 'json' };

const generatedCustomsFolder = 'generated-cn23';

readFile('./config/customers.json', { encoding: 'utf8' }, (error, data) => {
	if (error) { console.error('\x1b[31m Error while reading file: ', error) };

	try {
		if (!existsSync(generatedCustomsFolder)) {
			mkdir(generatedCustomsFolder, (error) => error && console.error('\x1b[31m Error while creating folder: ', error));
		}
	} catch (error) {
		console.error('\x1b[31m Error: ', error);
	};

	const customers: CustomersType = JSON.parse(data);
	customers.forEach(
		(customer, index) => {
			const documentData = { ...customer, ...defaultConfiguration };

			setTimeout(
				async () => {
					try {
						console.log(`\x1b[32m [n°${index + 1}] - fetching for ${customer.receiver.userFirstName}-${customer.receiver.userLastName}... \x1b[0m`);
						const request = await fetch('https://cn23.laposte.fr/form?lang=fr', {
							'credentials': 'include',
							'headers': {
								'accept': 'application/json, text/plain, */*',
								'accept-language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
								'cache-control': 'no-cache',
								'content-type': 'application/json',
								'pragma': 'no-cache',
								'sec-ch-ua': '\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"',
								'sec-ch-ua-mobile': '?0',
								'sec-ch-ua-platform': '\"macOS\"',
								'sec-fetch-dest': 'empty',
								'sec-fetch-mode': 'cors',
								'sec-fetch-site': 'same-origin',
								'Referer': 'https://cn23.laposte.fr/parcours/recapitulatif',
								'Referrer-Policy': 'strict-origin-when-cross-origin',
							},
							'referrer': 'https://cn23.laposte.fr/parcours/recapitulatif',
							'body': JSON.stringify(documentData),
							'method': 'POST',
							'mode': 'cors',
						});

						const response = await request.json();
						const documentBuffer = JSON.parse(response.pae.buffer);

						appendFile(
							`./${generatedCustomsFolder}/${customer.invoice}_${customer.receiver.userFirstName}-${customer.receiver.userLastName}_${response.pae.fileName}`,
							//@ts-ignore
							Buffer.from(documentBuffer.data),
							(error: any) => error && console.error('\x1b[31m Error while creating the file: ', error),
						);
						console.log(`\x1b[36m ✔ [n°${index + 1}] - "${customer.invoice}_${customer.receiver.userFirstName}-${customer.receiver.userLastName}_${response.pae.fileName}" successfully created! \x1b[0m`);
						(index === (customers.length - 1)) && console.log(`\x1b[32m ✔✔ done! \x1b[0m`);
					} catch (error) {
						console.error(`\x1b[31m [n°${index + 1}] - Error while trying to request the API: `, error);
					};
				},
				5000 * index,
			);
		}
	);
});
