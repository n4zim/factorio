
const URL = "https://wiki.factorio.com"

const RECIPES = [
  "Advanced_circuit",
  "Atomic_bomb",
  "Battery",
  "Big_electric_pole",
  "Bulk_inserter",
  "Cluster_grenade",
  "Concrete",
  "Copper_cable",
  "Copper_plate",
  "Electric_engine_unit",
  "Electronic_circuit",
  "Engine_unit",
  "Explosive_rocket",
  "Explosives",
  "Express_splitter",
  "Express_transport_belt",
  "Express_underground_belt",
  "Fast_inserter",
  "Fast_splitter",
  "Fast_transport_belt",
  "Fast_underground_belt",
  "Firearm_magazine",
  "Flying_robot_frame",
  "Grenade",
  "Inserter",
  "Iron_gear_wheel",
  "Iron_plate",
  "Iron_stick",
  "Long-handed_inserter",
  "Low_density_structure",
  "Lubricant",
  "Molten_iron",
  "Nuclear_fuel",
  "Piercing_rounds_magazine",
  "Pipe_to_ground",
  "Pipe",
  "Plastic_bar",
  "Processing_unit",
  "Rail",
  "Refined_concrete",
  "Rocket_fuel",
  "Rocket",
  "Splitter",
  "Steel_plate",
  "Stone_brick",
  "Sulfur",
  "Sulfuric_acid",
  "Transport_belt",
  "Tungsten_plate",
  "Turbo_splitter",
  "Turbo_transport_belt",
  "Turbo_underground_belt",
  "Underground_belt",
  "Uranium_rounds_magazine",
  "Uranium-235",
  "Uranium-238",
]

const BASE = [
  "Calcite",
  "Coal",
  "Copper_ore",
  "Heavy_oil",
  "Iron_ore",
  "Light_oil",
  "Petroleum_gas",
  "Solid_fuel",
  "Stone",
  "Tungsten_ore",
  "Uranium_ore",
  "Water",
]

const fs = require('fs')
const { JSDOM } = require('jsdom')

;(async () => {
  const data = require('./docs/data.json')
  const missing = []
  for (const recipe of [ ...RECIPES, ...BASE ]) {
    if (data.recipes[recipe]) {
      for(const ingredient in data.recipes[recipe].ingredients) {
        if(
          !RECIPES.includes(ingredient)
          && !BASE.includes(ingredient)
          && missing.indexOf(ingredient) === -1
        ) {
          missing.push(ingredient)
        }
      }
      continue
    }
    console.log(`Fetching recipe: ${recipe}`)

    const page = await getWikiPage(recipe)
    const doc = new JSDOM(page).window.document
    const td = doc.querySelector('td.infobox-vrow-value')
    if (!td) continue

    let icon
    const img = doc.querySelector('div.factorio-icon img')
    if (img) {
      icon = URL + img.getAttribute('src')
    }

    const ingredients = {}
    let time
    for (const div of td.querySelectorAll('div.factorio-icon')) {
      if (div.previousSibling && div.previousSibling.textContent && div.previousSibling.textContent.includes('→')) break
      const a = div.querySelector('a')
      let name
      if (a) {
        const href = a.getAttribute('href')
        if (href && href.startsWith('/')) {
          name = href.slice(1)
        }
      }
      const quantity = div.querySelector('.factorio-icon-text')?.textContent?.trim()
      if (name && quantity) {
        if (name === "Time") {
          time = Number(quantity)
        } else {
          ingredients[name] = Number(quantity)
        }
      }
    }
    if(typeof time === 'undefined' && BASE.indexOf(recipe) === -1) {
      console.warn(`Could not find crafting time for recipe: ${recipe}`)
      continue
    }

    let output
    const outputDiv = td.querySelector('div.factorio-icon:last-of-type')
    if (outputDiv) {
      const quantity = outputDiv.querySelector('.factorio-icon-text')?.textContent?.trim()
      if (quantity) output = Number(quantity)
    }
    if (!output && BASE.indexOf(recipe) === -1) {
      console.warn(`Could not find output for recipe: ${recipe}`)
      continue
    }

    data.recipes[recipe] = {
      icon,
      ingredients: Object.keys(ingredients).length > 0 ? ingredients : undefined,
      time,
      output,
      link: `${URL}/${recipe}`
    }
  }
  fs.writeFileSync('./docs/data.json', JSON.stringify(data, null, 2))
  if(missing.length > 0) {
    console.log('Missing ingredients:')
    for(const ingredient of missing) {
      console.log(`  "${ingredient}",`)
    }
  }
})()

async function getWikiPage(name) {
  const page = `${URL}/${name}`
  const response = await fetch(page)
  if (!response.ok) {
    throw new Error(`Could not fetch page: ${name}`)
  }
  const text = await response.text()
  return text
}
