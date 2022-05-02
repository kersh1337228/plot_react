import PlotDateValue from './PlotDateValue'


function App() {
  // const data = {}
  // let new_data = {}
  // for (const key of Object.keys(data)) {
  //   new_data[key] = {}
  //   new_data[key].open = parseFloat(data[key]['1. open'])
  //   new_data[key].high = parseFloat(data[key]['2. high'])
  //   new_data[key].low = parseFloat(data[key]['3. low'])
  //   new_data[key].close = parseFloat(data[key]['4. close'])
  //   new_data[key].volume = parseInt(data[key]['5. volume'])
  // }
  const data = [
    {date: '2002-10-10', cost: 1000, balance: 1000, stocks: 0},
    {date: '2002-10-11', cost: 1000, balance: 800, stocks: 1},
    {date: '2002-10-12', cost: 1100, balance: 500, stocks: 2},
    {date: '2002-10-13', cost: 1500, balance: 500, stocks: 2},
    {date: '2002-10-15', cost: 700, balance: 500, stocks: 2},
    {date: '2002-10-16', cost: 1000, balance: 1000, stocks: 0},
    {date: '2002-10-17', cost: 1000, balance: 800, stocks: 1},
    {date: '2002-10-18', cost: 1100, balance: 500, stocks: 2},
    {date: '2002-10-19', cost: 1500, balance: 500, stocks: 2},
    {date: '2002-10-20', cost: 700, balance: 500, stocks: 2},
    {date: '2002-10-21', cost: 1000, balance: 1000, stocks: 0},
    {date: '2002-10-22', cost: 1000, balance: 800, stocks: 1},
    {date: '2002-10-23', cost: 1100, balance: 500, stocks: 2},
    {date: '2002-10-24', cost: 1500, balance: 500, stocks: 2},
    {date: '2002-10-25', cost: 700, balance: 500, stocks: 2},
  ]
  // <PlotFinancial data={new_data} />
  return (
      <PlotDateValue data={data} />
  )
}

export default App
