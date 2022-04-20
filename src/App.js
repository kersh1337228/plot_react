import Plot from './Plot'


function linspace(a, b, number=(b - a) / 0.01) {
  let range = []
  for (let i = a; i <= b; i += (b - a) / number) {
    range.push(i)
  }
  return range
}


function App() {
  let x = linspace(-10, 10)
  let y = []
  x.forEach(xs => y.push(Math.sin(xs)))
  const data = {
    x: x,
    y: y
  }
  return (
      <Plot data={data} type={'math'} />
  )
}

export default App
