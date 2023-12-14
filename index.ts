import { appendFile, existsSync, mkdir, readFile } from 'fs';
import type { CustomersType } from './config/customersType.ts';
import defaultConfiguration from './config/default.json' assert { type: 'json' };

const generatedCustomsFolder = 'generated-cn23';

readFile('./config/customers.json', 'utf8', async (error, data) => {
	if (error) { console.error('Error while reading file: ', error) }

	try {
		if (!existsSync(generatedCustomsFolder)) {
			mkdir(generatedCustomsFolder, (error) => error && console.error('Error while creating folder: ', error));
		}
	} catch (error) {
		console.error('Error: ', error);
	}

	const customers: CustomersType = JSON.parse(data);
	customers.forEach(
		async (customer, index) => {
			const documentData = { ...customer, ...defaultConfiguration };

			setTimeout(
				async () => {
					try {
						const request = await fetch('https://cn23.laposte.fr/api/form?lang=fr', {
							'credentials': 'include',
							'headers': {
								'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
								'Accept': 'application/json, text/plain, */*',
								'Accept-Language': 'en-US,en;q=0.5',
								'Content-Type': 'application/json',
								'Sec-Fetch-Dest': 'empty',
								'Sec-Fetch-Mode': 'cors',
								'Sec-Fetch-Site': 'same-origin',
								'Pragma': 'no-cache',
								'Cache-Control': 'no-cache'
							},
							'referrer': 'https://cn23.laposte.fr/',
							'body': JSON.stringify(documentData),
							'method': 'POST',
							'mode': 'cors',
						});

						const response = await request.json();
						const documentBuffer = JSON.parse(response.pae.buffer)

						appendFile(
							`./${generatedCustomsFolder}/${customer.invoice}_${customer.receiver.userFirstName}-${customer.receiver.userLastName}_${response.pae.fileName}`,
							Buffer.from(documentBuffer.data),
							(error: any) => error && console.error('Error while creating the file: ', error),
						);
						console.log(`\x1b[36m ✔ "${customer.invoice}_${customer.receiver.userFirstName}-${customer.receiver.userLastName}_${response.pae.fileName}" successfully created! \x1b[0m`);
						(index === (customers.length -1)) && console.log(`\x1b[32m ✔✔ done! \x1b[0m`);
					} catch (error) {
						console.error('Error while trying to request the API', error)
					}
				},
				30000 * index,
			);
		}
	);
});
