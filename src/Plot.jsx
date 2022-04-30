import React from 'react'


// Figure inner axis class
class Axis {
    constructor() {
        this.center = 0
        this.visible = true
        this.color = '#000000'
        this.width = 1
        this.labels = {
            visible: true,
            amount: 0,
            font: {
                style: 'normal',
                size: 10,
                fontFamily: 'Times New Roman'
            },
            color: '#000000'
        }
        this.path = null
    }
    get_labels_font(density) { // Canvas formatted label style
        return `${this.labels.font.style} ${this.labels.font.size * density}px ${this.labels.font.fontFamily}`
    }
}


// Figure class containing main plot component data
class Figure {
    constructor() {
        this.window_size = {
            width: 850,
            height: 480,
        }
        this.scale = {
            width: 1,
            height: 1,
        }
        this.padding = {
            left: 0,
            top: 0.1,
            right: 0,
            bottom: 0.1
        }
        this.style = {
            color: '#ff0000',
            width: 2
        }
        this.canvas_density = 25
        this.path = null
    }
    // Canvas actual width
    get_width() {
        return this.window_size.width * this.canvas_density
    }
    // Canvas actual height
    get_height() {
        return this.window_size.height * this.canvas_density
    }
    // Rescales original line width for proper display
    get_line_width() {
        return this.style.width / (this.scale.height + this.scale.width)
    }
}


// Plot component allowing to draw charts using canvas tag
export default class Plot extends React.Component {
    constructor(props) {
        // Component data initialization
        super(props)
        this.state = {
            data: props.data,
            figure: new Figure(),
            axes: {
                x: new Axis(),
                y: new Axis(),
            },
            grid: {
                vertical: {
                    amount: 10,
                    color: '#d9d9d9',
                    width: 1,
                    path: null,
                },
                horizontal: {
                    amount: 10,
                    color: '#d9d9d9',
                    width: 1,
                    path: null,
                },
            },
            context: null,
        }
        this.type = props.type
        this.canvas = React.createRef()
    }
    // Date-value type plot (<date:String>, <value:Number>)
    plot_date_value() {
        let state = this.state
        const balance = Array.from(this.state.data, obj => obj.balance)
        // Rescaling
        state.figure.scale.height = (state.figure.get_height() * (1 - state.figure.padding.bottom - state.figure.padding.top)) /
            Math.abs(Math.max.apply(null, balance) - Math.min.apply(null, balance))
        state.figure.scale.width = (state.figure.get_width() * (1 - state.figure.padding.left - state.figure.padding.right)) / (balance.length - 1)
        // Moving coordinates system
        state.axes.y.center = Math.max.apply(null, balance) *
            state.figure.scale.height + state.figure.padding.top * state.figure.get_height()
        state.axes.x.center = state.figure.padding.left * state.figure.window_size.width
        state.context.save()
        state.context.translate(state.axes.x.center, state.axes.y.center)
        state.context.scale(state.figure.scale.width, -state.figure.scale.height)
        // Drawing plot
        let figure_path = new Path2D()
        state.context.lineWidth = state.figure.get_line_width()
        state.context.strokeStyle = state.figure.style.color
        state.context.lineJoin = 'round'
        figure_path.moveTo(0, state.balance[0])
        for (let i = 1; i < state.balance.length; ++i) {
            figure_path.lineTo(i, state.balance[i])
        }
        state.context.stroke(figure_path)
        // Saving figure path
        state.figure.path = figure_path
        state.context.restore() // Restoring context
        this.setState(state)
    }
    // Financial type plot (
    //      <date:String>,
    //      (<open:Number>, <high:Number>, <low:Number>, <close:Number>, <volume:Number>)
    // )
    plot_financial() {
        let state = this.state
        const [lows, highs] = [
            Array.from(Object.values(this.state.data), obj => obj.low),
            Array.from(Object.values(this.state.data), obj => obj.high),
        ]
        // Rescaling
        state.figure.scale.height = (state.figure.get_height() * (1 - state.figure.padding.bottom - state.figure.padding.top)) /
            Math.abs(Math.max.apply(null, highs) - Math.min.apply(null, lows))
        state.figure.scale.width = (state.figure.get_width() * (1 - state.figure.padding.left - state.figure.padding.right)) / (highs.length)
        // Moving coordinates system
        state.axes.y.center = Math.max.apply(null, highs) *
            state.figure.scale.height + state.figure.padding.top * state.figure.get_height()
        state.axes.x.center = state.figure.padding.left * state.figure.window_size.width
        state.context.save()
        state.context.translate(state.axes.x.center, state.axes.y.center)
        state.context.scale(1, -state.figure.scale.height)
        // Drawing plot
        state.context.lineJoin = 'round'
        const data = Object.values(state.data)
        for (let i = 0; i < data.length; ++i) {
            const {open, high, low, close, volume} = data[i]
            const style = close - open > 0 ? '#53e9b5' : '#da2c4d'
            state.context.beginPath()
            state.context.strokeStyle = style
            state.context.moveTo((2 * i + 1) * state.figure.scale.width / 2, low)
            state.context.lineTo((2 * i + 1) * state.figure.scale.width / 2, high)
            state.context.stroke()
            state.context.fillStyle = style
            state.context.fillRect(i * this.state.figure.scale.width , open, this.state.figure.scale.width, close - open)
            state.context.closePath()
        }
        state.context.restore()
    }
    // Show translucent grid
    show_grid(callback) {
        const context = this.state.context
        let grid = this.state.grid
        // Drawing horizontal
        let horizontal_grid_path = new Path2D()
        context.lineWidth = grid.horizontal.width * this.state.figure.canvas_density
        context.strokeStyle = grid.horizontal.color
        for (let i = 1; i <= grid.horizontal.amount; ++i) {
            const y = this.state.figure.get_height() * i / grid.horizontal.amount
            horizontal_grid_path.moveTo(0, y)
            horizontal_grid_path.lineTo(this.state.figure.get_width(), y)
        }
        grid.horizontal.path = horizontal_grid_path
        context.stroke(horizontal_grid_path)
        // Drawing vertical
        let vertical_grid_path = new Path2D()
        context.lineWidth = grid.vertical.width * this.state.figure.canvas_density
        context.strokeStyle = grid.vertical.color
        for (let i = 1; i <= grid.vertical.amount; ++i) {
            const x = this.state.figure.get_width() * i / grid.vertical.amount
            vertical_grid_path.moveTo(x, 0)
            vertical_grid_path.lineTo(x, this.state.figure.get_height())
        }
        grid.vertical.path = vertical_grid_path
        context.stroke(vertical_grid_path)
        this.setState({grid: grid}, callback)
    }

    componentDidMount() {
        let canvas = this.canvas.current
        canvas.style.width = `${this.state.figure.window_size.width}px`
        canvas.style.height = `${this.state.figure.window_size.height}px`
        canvas.width = this.state.figure.get_width()
        canvas.height = this.state.figure.get_height()
        this.setState({context: this.canvas.current.getContext('2d')}, () => {
            this.show_grid({
                'date_value': this.plot_date_value,
                'financial': this.plot_financial,
            }[this.type]) // Choosing plot method depending on plot type
        })
    }

    componentDidUpdate() {

    }

    render() {
        return (
            <canvas ref={this.canvas} style={{border: '1px solid black'}}>
                Canvas tag is not supported by your browser.
            </canvas>
        )
    }
}
