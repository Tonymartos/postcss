import v8 from 'v8'

import postcss, { Root, Declaration, Input, Rule } from '../lib/postcss.js'

it('rehydrates a JSON AST', () => {
  let cssWithMap = postcss().process(
    '.foo { color: red; font-size: 12pt; } /* abc */ @media (width: 60em) { }',
    {
      from: 'x.css',
      map: {
        inline: true
      },
      stringifier: postcss.stringify
    }
  ).css

  let root = postcss.parse(cssWithMap)

  let json = root.toJSON()
  let serialized = v8.serialize(json)
  let deserialized = v8.deserialize(serialized)
  let rehydrated = postcss.fromJSON(deserialized as object) as Root

  rehydrated.nodes[0].remove()

  expect(rehydrated.nodes).toHaveLength(3)

  expect(
    postcss().process(rehydrated, {
      from: undefined,
      map: {
        inline: true
      },
      stringifier: postcss.stringify
    }).css
  ).toBe(`/* abc */ @media (width: 60em) { }
/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInguY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFzQyxRQUFRLEVBQUUsdUJBQXVCIiwiZmlsZSI6InRvLmNzcyIsInNvdXJjZXNDb250ZW50IjpbIi5mb28geyBjb2xvcjogcmVkOyBmb250LXNpemU6IDEycHQ7IH0gLyogYWJjICovIEBtZWRpYSAod2lkdGg6IDYwZW0pIHsgfSJdfQ== */`)
})

it('rehydrates an array of Nodes via JSON.stringify', () => {
  let root = postcss.parse('.cls { color: orange; }')

  let rule = root.first as Rule
  let json = JSON.stringify(rule.nodes)
  let rehydrated = postcss.fromJSON(JSON.parse(json) as object[])
  expect(rehydrated[0]).toBeInstanceOf(Declaration)
  expect(rehydrated[0].source?.input).toBeInstanceOf(Input)
})

it('throws when rehydrating an invalid JSON AST', () => {
  expect(() => {
    postcss.fromJSON({ type: 'not-a-node-type' })
  }).toThrow('Unknown node type: not-a-node-type')
})
