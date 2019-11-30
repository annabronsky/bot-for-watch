const puppeteer = require('puppeteer'),
    fs = require('fs'),
    fastCsv = require('fast-csv'),
    ws = fs.createWriteStream("data.csv");
let startLink = 'https://www.jomashop.com/watches.html?p=';
let table = [];
let k = 1;

async function init(k) {
    (async () => {
        await new Promise(async (resolve, reject) => {
            const browser = await puppeteer.launch({headless: false});
            const page = await browser.newPage();
            await page.goto(startLink + k, {waitUntil: 'domcontentloaded',timeout: 0});
            let linksData = await page.evaluate(async () => {
                let links = [];
                let linksElms = await document.querySelectorAll('li.item');
                linksElms.forEach((linkElement) => {
                    let link;
                    try {
                        link = linkElement.querySelector('div.product-image-wrapper a').getAttribute('href');
                    } catch (exception) {
                    }
                    link ? links.push(link) : null;
                });
                return links;
            });
            browser.close();
            if (linksData.length === 0) {
                let reason = new Error('no data');
                reject(reason);
            } else
                resolve(getInfo(linksData))
        })
    })()
}

init(k);

async function getInfo(data) {
    for (let i = 0; i < data.length; i++) {
        await (async () => {
            await new Promise(async (resolve, reject) => {
                const browser = await puppeteer.launch({headless: false});
                const page = await browser.newPage();
                await page.goto(data[i], {waitUntil: 'domcontentloaded',timeout: 0});
                let product = await page.evaluate(async () => {
                    const fields = {
                        ReferenceNumber: '',
                        WatchName: '',
                        Gender: '',
                        Location: 'world',
                        Price: '',
                        Currency: 'USD',
                        BrandName: '',
                        Condition: 'New',
                        ScopeOfDelivery: '',
                        WatchLink: '',
                        WatchImage: '',
                        WebsiteName: 'Jomashop',
                        WatchModel: '',
                        Year: '',
                        Movement: '',
                        PowerReserve: '',
                        NumberOfJewels: '',
                        CaseDiameter: '',
                        CaseMaterial: '',
                        WaterResistanceAtm: '',
                        BezelMaterial: '',
                        Glass: '',
                        DialColor: '',
                        BraceletMaterial: '',
                        BraceletColor: '',
                        Buckle: '',
                        BuckleMaterial: '',
                        Functions: '',
                        Description: '',
                        Other: ''
                    };
                    let productJson = {...fields};
                    let productInfoGroups = await document.querySelectorAll('.attribute-group-information .attribute-list li');
                    let nameProd = '';

                    await productInfoGroups.forEach(element => {
                        let label;
                        try {
                            label = element.querySelector('label').firstChild.textContent;
                            switch (label) {
                                case 'Brand ':
                                    productJson.BrandName = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    nameProd += productJson.BrandName;
                                    break;
                                case 'Series ':
                                    let model = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    nameProd += ' ' + model.charAt(0).toUpperCase() + model.slice(1).toLowerCase();
                                    productJson.WatchModel = model.replace(/[!?,; :'"-]/g, '.').toLowerCase();
                                    break;
                                case 'Model ':
                                    let number = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    nameProd += ' ' + number.charAt(0).toUpperCase() + number.slice(1).toLowerCase();
                                    productJson.ReferenceNumber = number.toUpperCase();
                                    break;
                                case 'Movement ':
                                    productJson.Movement = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                                case 'Gender ':
                                    const regexU = /[U]/g;
                                    const regexW = /[W]/g;
                                    let sex = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    if (sex.match(regexU))
                                        productJson.Gender = "U";
                                    else if (sex.match(regexW))
                                        productJson.Gender = "W";
                                    else
                                        productJson.Gender = "M";
                                    break;
                                case 'Power Reserve ':
                                    let powerData = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '').split(' ');
                                    productJson.PowerReserve = Math.round(Number(powerData[0]));
                                    break;
                            }
                        } catch (exception) {
                        }
                    });

                    let productDialGroups = await document.querySelectorAll('.attribute-group-dial .attribute-list li');
                    await productDialGroups.forEach(element => {
                        let label;
                        try {
                            label = element.querySelector('label').firstChild.textContent;
                            switch (label) {
                                case 'Dial Markers ':
                                    const regexDiamond = /diamond/gi;
                                    let markers = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    let splitMarkers = markers.split(' ');
                                    if (markers.match(regexDiamond))
                                        productJson.NumberOfJewels = Number(splitMarkers[0]);
                                    break;
                                case 'Bezel Material ':
                                    productJson.BezelMaterial = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                                case 'Crystal ':
                                    productJson.Glass = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                                case 'Dial Color ':
                                    productJson.DialColor = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                            }
                        } catch (exception) {
                        }
                    });

                    let productCaseGroups = await document.querySelectorAll('.attribute-group-case .attribute-list li');
                    await productCaseGroups.forEach(element => {
                        let label;
                        try {
                            label = element.querySelector('label').firstChild.textContent;
                            switch (label) {
                                case 'Case Size ':
                                    let size = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '').split(' ');
                                    productJson.CaseDiameter = Math.round(Number(size[0]));
                                    break;
                                case 'Case Material ':
                                    productJson.CaseMaterial = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                            }
                        } catch (exception) {
                        }
                    });

                    let productFeatureGroups = await document.querySelectorAll('.attribute-group-features .attribute-list li');
                    await productFeatureGroups.forEach(element => {
                        let label;
                        try {
                            label = element.querySelector('label').firstChild.textContent;
                            switch (label) {
                                case 'Water Resistance ':
                                    let resistance = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '').split(' ');
                                    let atm = Number(resistance[0]) / 10;
                                    productJson.WaterResistanceAtm = Math.round(atm);
                                    break;
                                case 'Functions ':
                                    productJson.Functions = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                                case 'Features ':
                                    productJson.Other = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                            }
                        } catch (exception) {
                        }
                    });

                    let productBandGroups = await document.querySelectorAll('.attribute-group-band .attribute-list li');
                    await productBandGroups.forEach(element => {
                        let label;
                        try {
                            label = element.querySelector('label').firstChild.textContent;
                            switch (label) {
                                case 'Band Material ':
                                    productJson.BraceletMaterial = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                                case 'Band Color ':
                                    productJson.BraceletColor = element.querySelector('.data').textContent.replace(/\n| $|^ */g, '');
                                    break;
                            }
                        } catch (exception) {
                        }
                    });
                    productJson.WatchName = nameProd;
                    productJson.WatchImage = document.querySelector('.MagicSlides a').getAttribute('href');
                    productJson.Description = document.querySelector('.product-description .std').innerText;
                    let price = Number(document.querySelector('#final-price').innerText.replace('$', ''))
                    productJson.Price = price;
                    return productJson;
                });
                browser.close();
                if (product.BrandName.length !== 0 && product.ReferenceNumber.length !== 0 && product.Location.length !== 0 && product.WatchModel.length !== 0 && typeof product.Price !== 'object') {
                    product.WatchLink = data[i];
                    resolve(table.push(product));
                } else
                    resolve()
            });
        })();
        if (table.length === 200) {
            console.log(table.length);
            await fastCsv
                .write([...table], {headers: true})
                .pipe(ws);
            break;
        } else if (i === data.length - 1) {
            init(++k)
        }
    }


}
