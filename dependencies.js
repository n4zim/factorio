const icons = []
const links = []

const data = require('./docs/data.json')
for(const recipe in data.recipes) {
  icons.push(`${recipe}[&lt;img src=&#39;${data.recipes[recipe].icon}&#39;/&gt;]`)
  for(const ingredient in data.recipes[recipe].ingredients) {
    const quantity = data.recipes[recipe].ingredients[ingredient]
    links.push(`${ingredient} -- ${quantity} --> ${recipe}`)
  }
}

require('fs').writeFileSync('./docs/dependencies.html', generate())

function generate() {
  return `<style>
  html { max-width: 100%; background-color: black; }
  img { width: 32px; height: 32px; }
  .edgeLabel { padding: 4px; }
  .node { background-color: white; }
</style>
<div class="mermaid">
graph TB
${icons.join('\n')}
%% --------------------------------------------------------------------
${links.join('\n')}
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.8.4/mermaid.min.js" integrity="sha512-as1BF4+iHZ3BVO6LLDQ7zrbvTXM+c/1iZ1qII/c3c4L8Rn5tHLpFUtpaEtBNS92f+xGsCzsD7b62XP3XYap6oA==" crossorigin="anonymous"></script>
<script>
mermaid.initialize({
  startOnLoad: true,
  securityLevel: 'loose',
  flowchart: {
    //useMaxWidth: false,
    htmlLabels: true,
  },
  themeVariables: {
    lineColor: 'white',
    textColor: "black",
  },
})
</script>`
}
