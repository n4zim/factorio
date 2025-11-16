
const URL = "https://wiki.factorio.com"

const RECIPES = [
  "Transport_belt",
  "Fast_transport_belt",
  "Express_transport_belt",
  "Turbo_transport_belt",

  "Underground_belt",
  "Fast_underground_belt",
  "Express_underground_belt",
  "Turbo_underground_belt",

  "Splitter",
  "Fast_splitter",
  "Express_splitter",
  "Turbo_splitter",

  "Inserter",
  "Long-handed_inserter",
  "Fast_inserter",
  "Bulk_inserter",

  "Big_electric_pole",
  "Pipe",
  "Pipe_to_ground",
  "Rail",

  "Stone_brick",
  "Concrete",
  "Refined_concrete",

  "Firearm_magazine",
  "Piercing_rounds_magazine",
  "Uranium_rounds_magazine",
  "Explosives",
  "Grenade",
  "Cluster_grenade",

  "Iron_gear_wheel",
  "Iron_plate",
  "Lubricant",
  "Tungsten_plate",
  "Electronic_circuit",
  "Advanced_circuit",
  "Processing_unit",
  "Copper_cable",
  "Iron_stick",
  "Steel_plate",
  "Copper_plate",
  "Uranium-238",
  "Sulfur",
  "Molten_iron",
  "Plastic_bar",
  "Sulfuric_acid",
]

const BASE = [
  "Stone",
  "Iron_ore",
  "Water",
  "Coal",
  "Heavy_oil",
  "Tungsten_ore",
  "Copper_ore",
  "Uranium_ore",
  "Petroleum_gas",
  "Calcite",
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
      ingredients: ingredients.length > 0 ? ingredients : undefined,
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
