import fs from "fs";

const baseURL = "https://pokeapi.co/api/v2/";

let cache = {};

if (fs.existsSync("cache.json")) {
  try {
    const text = fs.readFileSync("cache.json", "utf-8");
    cache = JSON.parse(text);
  } catch (error) {
    console.log("Cache file corrupted. Resetting cache.");
    cache = {};
  }
}

function saveCache() {
  fs.writeFileSync("cache.json", JSON.stringify(cache, null, 2));
}


let saveCounter = 0;

async function getData(url) {
  if (cache[url]) {
    return cache[url];
  }

  const response = await fetch(url);
  const data = await response.json();

  cache[url] = data;

  saveCounter++;
  if (saveCounter % 50 === 0) {
    saveCache();
  }

  return data;
}

async function processInBatches(list, batchSize, handler) {
  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize);
    const promises = batch.map(handler);
    await Promise.all(promises);
  }
}

function printQA(question, answer) {
  console.log("Question:", question);
  console.log("Answer:", answer);
  console.log("");
}
async function question1_averageHeightGen1() {
  const gen1 = await getData(baseURL + "generation/1");

  let totalHeight = 0;
  let count = 0;

  for (let i = 0; i < gen1.pokemon_species.length; i++) {
    const name = gen1.pokemon_species[i].name;
    const pokemon = await getData(baseURL + "pokemon/" + name);

    totalHeight += pokemon.height / 10;
    count++;
  }

  const averageHeight = totalHeight / count;

  printQA(
    "What is the average height of all Pokemon in the first generation?",
    averageHeight.toFixed(2) + " m"
  );
}

async function question2_highestBaseExpFire() {
  const fireType = await getData(baseURL + "type/fire");

  let bestName = "";
  let bestExp = -1;

  for (let i = 0; i < fireType.pokemon.length; i++) {
    const name = fireType.pokemon[i].pokemon.name;
    const pokemon = await getData(baseURL + "pokemon/" + name);

    if (pokemon.base_experience > bestExp) {
      bestExp = pokemon.base_experience;
      bestName = name;
    }
  }

  printQA(
    'Which Pokemon has the highest "Base Experience" among all Fire type Pokemon?',
    bestName + " (" + bestExp + ")"
  );
}


async function question3_countLevitate() {
  const levitate = await getData(baseURL + "ability/levitate");

  printQA(
    'How many different Pokemon possess the "Levitate" ability?',
    levitate.pokemon.length
  );
}

async function question4_fastestUnder10kg() {
  let bestName = "";
  let bestSpeed = -1;

  let url = baseURL + "pokemon?limit=200&offset=0";

  while (url) {
    const page = await getData(url);

    await processInBatches(page.results, 10, async (item) => {
      const name = item.name;
      const pokemon = await getData(baseURL + "pokemon/" + name);

      if (pokemon.weight < 100) {
        let speed = 0;

        for (let j = 0; j < pokemon.stats.length; j++) {
          if (pokemon.stats[j].stat.name === "speed") {
            speed = pokemon.stats[j].base_stat;
          }
        }

        if (speed > bestSpeed) {
          bestSpeed = speed;
          bestName = name;
        }
      }
    });

    url = page.next;
  }

  printQA(
    'Which Pokemon has the highest "Speed" stat among those that weigh less than 10kg?',
    bestName + " (Speed: " + bestSpeed + ")"
  );
}

async function question5_shortestElectric() {
  const electricType = await getData(baseURL + "type/electric");

  let bestName = "";
  let bestHeight = 999999; // big number

  for (let i = 0; i < electricType.pokemon.length; i++) {
    const name = electricType.pokemon[i].pokemon.name;

    const pokemon = await getData(baseURL + "pokemon/" + name);

    // height is in decimeters
    if (pokemon.height < bestHeight) {
      bestHeight = pokemon.height;
      bestName = name;
    }
  }

  // convert decimeters -> meters
  const meters = bestHeight / 10;

  printQA(
    'Which "Electric" type Pokemon has the shortest height?',
    bestName + " (" + meters + " m)"
  );
}

async function question6_heaviestPokemon() {
  let bestWeight = -1;
  let heaviestNames = [];

  let url = baseURL + "pokemon?limit=200&offset=0";

  while (url) {
    const page = await getData(url);

    await processInBatches(page.results, 10, async (item) => {
      const name = item.name;
      const pokemon = await getData(baseURL + "pokemon/" + name);

      if (pokemon.weight > bestWeight) {
        bestWeight = pokemon.weight;
        heaviestNames = [name];
      } else if (pokemon.weight === bestWeight) {
        heaviestNames.push(name);
      }
    });

    url = page.next;
  }

  const kg = bestWeight / 10;

  printQA(
    "What is the heaviest Pokemon?",
    heaviestNames.join(", ") + " (" + kg + " kg)"
  );
}

async function question7_longestNames() {
  let longestLength = 0;
  let longestNames = [];

  let url = baseURL + "pokemon?limit=200&offset=0";

  while (url) {
    const page = await getData(url);

    for (let i = 0; i < page.results.length; i++) {
      const name = page.results[i].name;

      if (name.length > longestLength) {
        longestLength = name.length;
        longestNames = [name];
      } else if (name.length === longestLength) {
        longestNames.push(name);
      }
    }

    url = page.next;
  }

  printQA(
    "What are the Pokemons with the longest names?",
    longestNames.join(", ") + " (" + longestLength + " characters)"
  );
}


await question1_averageHeightGen1();
await question2_highestBaseExpFire();
await question3_countLevitate();
await question4_fastestUnder10kg();
await question5_shortestElectric();
await question6_heaviestPokemon();
await question7_longestNames();

saveCache();

