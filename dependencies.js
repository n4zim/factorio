const icons = []
const links = []
const linkStyles = []
const ingredientColors = {}

const data = require('./docs/data.json')
let linkCount = 0
for(const recipeId in data.recipes) {
  const recipe = data.recipes[recipeId]
  icons.push(`${recipeId}[<a href='${recipe.link}'>&lt;img src=&#39;${recipe.icon}&#39;/&gt;</a>]`)
  for(const ingredient in recipe.ingredients) {
    const quantity = recipe.ingredients[ingredient]
    links.push(`${ingredient} -- ${quantity} --> ${recipeId}`)
    if (!ingredientColors[ingredient]) {
      ingredientColors[ingredient] = stringToColor(ingredient)
    }
    linkStyles.push(`linkStyle ${linkCount} stroke:${ingredientColors[ingredient]},stroke-width:3px`)
    linkCount++
  }
}


require('fs').writeFileSync('./docs/dependencies.html', generate())

function generate() {
  return `<style>
  html { max-width: 100%; background-color: black; }
  img { width: 32px; height: 32px; }
    .node { background-color: white; margin: 16px; }
</style>
  <div class="mermaid">
  graph TB
${icons.join('\n')}
%% --------------------------------------------------------------------
${links.join('\n')}
${linkStyles.join('\n')}
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.12.0/mermaid.min.js" crossorigin="anonymous"></script>
<script>
mermaid.initialize({
  startOnLoad: true,
  securityLevel: 'loose',
  flowchart: {
    rankSpacing: 200,
  },
  themeVariables: {
    textColor: "black",
    fontSize: '24px',
  },
})
</script>`
}

function stringToColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}
