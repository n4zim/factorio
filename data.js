
const URL = "https://wiki.factorio.com"

const RECIPES = [
  "Accumulator",
  "Advanced_circuit",
  "Agricultural_science_pack",
  "Ammonia",
  "Atomic_bomb",
  "Automation_science_pack",
  "Battery",
  "Big_electric_pole",
  "Bioflux",
  "Bulk_inserter",
  "Carbon_fiber",
  "Carbon",
  "Chemical_science_pack",
  "Cluster_grenade",
  "Concrete",
  "Copper_cable",
  "Copper_plate",
  "Cryogenic_science_pack",
  "Electric_engine_unit",
  "Electric_furnace",
  "Electrolyte",
  "Electromagnetic_science_pack",
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
  "Fluoroketone_(cold)",
  "Fluoroketone_(hot)",
  "Flying_robot_frame",
  "Grenade",
  "Holmium_ore",
  "Holmium_plate",
  "Holmium_solution",
  "Inserter",
  "Iron_gear_wheel",
  "Iron_plate",
  "Iron_stick",
  "Jelly",
  "Lithium_plate",
  "Lithium",
  "Logistic_science_pack",
  "Long-handed_inserter",
  "Low_density_structure",
  "Lubricant",
  "Metallurgic_science_pack",
  "Military_science_pack",
  "Molten_copper",
  "Molten_iron",
  "Nuclear_fuel",
  "Pentapod_egg",
  "Piercing_rounds_magazine",
  "Pipe_to_ground",
  "Pipe",
  "Plastic_bar",
  "Processing_unit",
  "Production_science_pack",
  "Productivity_module",
  "Promethium_science_pack",
  "Quantum_processor",
  "Rail",
  "Refined_concrete",
  "Rocket_fuel",
  "Rocket",
  "Space_science_pack",
  "Splitter",
  "Steel_plate",
  "Stone_brick",
  "Sulfur",
  "Sulfuric_acid",
  "Supercapacitor",
  "Superconductor",
  "Transport_belt",
  "Tungsten_carbide",
  "Tungsten_plate",
  "Turbo_splitter",
  "Turbo_transport_belt",
  "Turbo_underground_belt",
  "Underground_belt",
  "Uranium_rounds_magazine",
  "Uranium-235",
  "Uranium-238",
  "Utility_science_pack",
  "Wall",
  "Yumako_mash",
]

const BASE = [
  "Ammoniacal_solution",
  "Biter_egg",
  "Calcite",
  "Coal",
  "Copper_ore",
  "Fluorine",
  "Heavy_oil",
  "Ice",
  "Iron_ore",
  "Jellynut",
  "Light_oil",
  "Lithium_brine",
  "Nutrients",
  "Petroleum_gas",
  "Promethium_asteroid_chunk",
  "Scrap",
  "Solid_fuel",
  "Stone",
  "Tungsten_ore",
  "Uranium_ore",
  "Water",
  "Yumako",
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

    /* const td = doc.querySelector('td.infobox-vrow-value')
    if (!td) {
      console.warn(`Could not find recipe details for: ${recipe}`)
      continue
    } */

    let icon
    const img = doc.querySelector('div.factorio-icon img')
    if (img) {
      icon = URL + img.getAttribute('src')
    }

    const notABase = BASE.indexOf(recipe) === -1

    const table = doc.querySelector('div.infobox > table.tab:last-child')
    if(!table && notABase) {
      console.warn(`Could not find recipe table for: ${recipe}`)
      continue
    }

    const ingredients = {}
    let time
    if(table) {
      for (const div of table.querySelectorAll('div.factorio-icon')) {
        if (div.previousSibling && div.previousSibling.textContent && div.previousSibling.textContent.includes('→')) break
        const a = div.querySelector('a')
        let name
        if (a) {
          const href = a.getAttribute('href')
          if (href) {
            name = href.split('/').pop()
          }
        }
        const quantity = table.querySelector('.factorio-icon-text')?.textContent?.trim()
        //console.log("=== ", name, quantity)
        if (name && quantity) {
          if (name === "Time") {
            time = Number(quantity)
          } else {
            ingredients[name] = Number(quantity)
          }
        }
      }
      if(typeof time === 'undefined' && notABase) {
        console.warn(`Could not find crafting time for recipe: ${recipe}`)
        continue
      }
    }

    let output
    if(table && notABase) {
      const outputDiv = table.querySelector('div.factorio-icon:last-of-type')
      if (outputDiv) {
        const quantity = outputDiv.querySelector('.factorio-icon-text')?.textContent?.trim()
        if (quantity) output = Number(quantity)
      }
      if (!output && notABase) {
        console.warn(`Could not find output for recipe: ${recipe}`)
        continue
      }
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
