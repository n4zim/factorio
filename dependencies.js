const items = []
const recipes = []
const styles = []
const ingredientColors = {}

const data = require('./docs/data.json')

const deps = {}, total = {}, output = {}
for(const recipeId in data.recipes) {
  const recipe = data.recipes[recipeId]
  output[recipeId] = (recipe.output || 1) / (recipe.time || 1)
  for(const ingredient in recipe.ingredients) {
    deps[ingredient] = (deps[ingredient] || 0) + 1
    total[ingredient] = (total[ingredient] || 0) + recipe.ingredients[ingredient]
  }
}

const recipeTotalsCache = {}
for(const recipeId in data.recipes) {
  recipeTotalsCache[recipeId] = calculateTotal(recipeId, 1)
}
const final = {}
for(const ingredientId in deps) {
  final[ingredientId] = calculateIngredientTotal(ingredientId)
}
for(const recipeId in data.recipes) {
  if (!deps[recipeId]) {
    const totals = recipeTotalsCache[recipeId]
    final[recipeId] = Object.values(totals).reduce((a, b) => a + b, 0)
  }
}

let linkCount = 0
for(const recipeId in data.recipes) {
  const recipe = data.recipes[recipeId]
  items.push(`${format(recipeId)}[<a href='${encode(recipe.link)}'>&lt;img src=&#39;${recipe.icon}&#39;/&gt;</a><br>Output: ${round(output[recipeId] || 0)}/s${deps[recipeId] ? `<br>Links: ${deps[recipeId]}<br>Required: ${total[recipeId] || 0}<br>For final: ${Math.ceil(final[recipeId] || 0)}<br>Min. build: ${Math.ceil(final[recipeId] / (output[recipeId] || 1))}` : ''}]`)
  for(const ingredient in recipe.ingredients) {
    if (!ingredientColors[ingredient]) {
      ingredientColors[ingredient] = stringToColor(ingredient)
    }
    const quantity = recipe.ingredients[ingredient]
    recipes.push(`${format(ingredient)} -- "<div class='label' style='background-color:${ingredientColors[ingredient]};'>${quantity}</div>" --> ${format(recipeId)}`)
    styles.push(`style ${format(ingredient)} fill:${ingredientColors[ingredient]},stroke:#333,stroke-width:2px`)
    styles.push(`linkStyle ${linkCount} stroke:${ingredientColors[ingredient]},stroke-width:3px`)
    linkCount++
  }
}

require('fs').writeFileSync('./docs/dependencies.html', generate())

function generate() {
  return `<html><head><meta charset="UTF-8"><title>Factorio - Recipes Dependencies</title>
  <style>html { max-width: 100%; background-color: black; } .node { margin: 16px; } .label { font-weight: bold; text-align: center; }</style></head><body><div class="mermaid">
  flowchart TD
${items.join('\n')}
%% --------------------------------------------------------------------
${recipes.join('\n')}
${styles.join('\n')}
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.12.0/mermaid.min.js" crossorigin="anonymous"></script>
<script>
mermaid.initialize({
  startOnLoad: true,
  maxTextSize: 90000,
  securityLevel: "loose",
  flowchart: { rankSpacing: 200 },
  themeVariables: { textColor: "black", fontSize: "24px" },
})
</script></body></html>`
}

function stringToColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}

function round(num) {
  return Math.round(num * 10) / 10
}

function calculateTotal(recipeId, quantity = 1, pathVisited = []) {
  const totals = {}
  if (pathVisited.includes(recipeId)) return totals
  const recipe = data.recipes[recipeId]
  if (!recipe || !recipe.ingredients) {
    totals[recipeId] = quantity
    return totals
  }
  const multiplier = quantity / (recipe.output || 1)
  const newPath = [...pathVisited, recipeId]
  for (const ingredient in recipe.ingredients) {
    const needed = recipe.ingredients[ingredient] * multiplier
    const subTotals = calculateTotal(ingredient, needed, newPath)
    for (const item in subTotals) {
      totals[item] = (totals[item] || 0) + subTotals[item]
    }
  }
  return totals
}

function calculateIngredientTotal(ingredientId, visited = new Set()) {
  if (visited.has(ingredientId)) return 0
  visited.add(ingredientId)
  let total = 0
  const isUsedElsewhere = deps[ingredientId] > 0
  if (!isUsedElsewhere) {
    total = 0
  } else {
    for(const recipeId in data.recipes) {
      const recipe = data.recipes[recipeId]
      if (recipe.ingredients && recipe.ingredients[ingredientId]) {
        const qtyNeeded = recipe.ingredients[ingredientId]
        const recipeIsUsedElsewhere = deps[recipeId] > 0
        if (!recipeIsUsedElsewhere) {
          total += qtyNeeded
        } else {
          const recursiveCount = calculateIngredientTotal(recipeId, visited)
          total += qtyNeeded * recursiveCount
        }
      }
    }
  }
  visited.delete(ingredientId)
  return total
}

function format(text) {
  return text.replaceAll(/\(|\)/g, '')
}

function encode(text) {
  return text.replaceAll('(', '%28').replaceAll(')', '%29')
}
