import React from 'react'


// Python-like zip function
function zip(...args) {
    return [...args[0]].map((_, i) => args.map(arg => arg[i]))
}


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
        this.path = null
    }
    // Canvas actual width
    get_width() {
        return this.window_size.width *
            (1 + this.padding.left + this.padding.right)
    }
    // Canvas actual height
    get_height() {
        return this.window_size.height *
            (1 + this.padding.bottom + this.padding.top)
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
        switch(this.type) {
            case 'date_value':
                this.state.balance = Array.from(this.state.data, obj => obj.balance)
                break
            case 'financial':
                [this.state.low, this.state.high] = [
                    Array.from(Object.values(this.state.data), obj => obj.low),
                    Array.from(Object.values(this.state.data), obj => obj.high),
                ]
                break
            default:
                throw Error('Wrong plot type specifier')
        }
        this.canvas = React.createRef()
    }
    // Find the difference between window sizes and canvas sizes
    set_scale(callback) {
        let figure = this.state.figure
        switch(this.type) {
            case 'date_value':
                figure.scale.height = (figure.window_size.height * (1 - figure.padding.bottom - figure.padding.top)) /
                    Math.abs(Math.max.apply(null, this.state.balance) - Math.min.apply(null, this.state.balance))
                figure.scale.width = (figure.window_size.width * (1 - figure.padding.left - figure.padding.right)) / (this.state.balance.length - 1)
                break
            case 'financial':
                figure.scale.height = (figure.window_size.height * (1 - figure.padding.bottom - figure.padding.top)) /
                    Math.abs(Math.max.apply(null, this.state.high) - Math.min.apply(null, this.state.low))
                figure.scale.width = (figure.window_size.width * (1 - figure.padding.left - figure.padding.right)) / (this.state.low.length)
                break
        }
        // Applying changes
        this.setState({figure: figure}, callback)
    }
    // Rescales window and canvas itself
    set_window() {
        let canvas = this.canvas.current
        // Window
        canvas.style.width = `${this.state.figure.window_size.width}px`
        canvas.style.height = `${this.state.figure.window_size.height}px`
        // Canvas
        canvas.width = this.state.figure.window_size.width
        canvas.height = this.state.figure.window_size.height
    }
    // Changing coordinates system center X0 = (x0, y0)
    set_coordinates_system(callback) {
        let axes = this.state.axes
        const context = this.state.context
        context.save()
        switch (this.type) { // Window left bottom corner
            case 'date_value':
                axes.y.center = Math.max.apply(null, this.state.balance) *
                    this.state.figure.scale.height + this.state.figure.padding.top * this.state.figure.window_size.height
                context.translate(this.state.axes.x.center, this.state.axes.y.center)
                context.scale(this.state.figure.scale.width, -this.state.figure.scale.height)
                break
            case 'financial':
                axes.y.center = Math.max.apply(null, this.state.high) *
                    this.state.figure.scale.height + this.state.figure.padding.top * this.state.figure.window_size.height
                context.translate(this.state.axes.x.center, this.state.axes.y.center)
                context.scale(1, -this.state.figure.scale.height)
                break
        }
        axes.x.center = this.state.figure.padding.left * this.state.figure.window_size.width
        // Applying changes
        this.setState({axes: axes, context: context}, callback)
    }
    // Drawing plot depending on plot type
    plot() {
        // Rescaling based on original input data
        this.setState({context: this.canvas.current.getContext('2d')}, () => {
            this.set_scale(() => {
                this.show_grid(() => {
                    this.set_coordinates_system({
                        'date_value': this.plot_date_value,
                        'financial': this.plot_financial,
                    }[this.type]) // Choosing plot method depending on plot type
                })
            })
        })
    }
    // Date-value type plot (<date:String>, <value:Number>)
    plot_date_value() {
        const context = this.state.context
        // Drawing plot
        let figure_path = new Path2D()
        context.lineWidth = this.state.figure.get_line_width()
        context.strokeStyle = this.state.figure.style.color
        context.lineJoin = 'round'
        figure_path.moveTo(0, this.state.balance[0])
        for (let i = 1; i < this.state.balance.length; ++i) {
            figure_path.lineTo(i, this.state.balance[i])
        }
        context.stroke(figure_path)
        // Saving figure path
        let figure = this.state.figure
        figure.path = figure_path
        context.restore() // Restoring context
        this.setState({figure: figure, context:context})
    }
    // Financial type plot (
    //      <date:String>,
    //      (<open:Number>, <high:Number>, <low:Number>, <close:Number>, <volume:Number>)
    // )
    plot_financial() {
        console.log(this.state)
        const context = this.state.context
        context.lineJoin = 'round'
        let i = 0
        for (const [date, {open, high, low, close, volume}] of Object.entries(this.state.data)) {
            this.draw_candle(i, open, high, low, close)
            ++i
        }
        context.restore()
    }
    draw_candle(date, open, high, low, close) {
        const context = this.state.context
        const style = close - open > 0 ? '#53e9b5' : '#da2c4d'
        context.beginPath()
        context.strokeStyle = style
        context.moveTo((2 * date + 1) * this.state.figure.scale.width / 2, low )
        context.lineTo((2 * date + 1) * this.state.figure.scale.width / 2, high)
        context.stroke()
        context.fillStyle = style
        context.fillRect(date * this.state.figure.scale.width , open, this.state.figure.scale.width, close - open)
        context.closePath()
    }
    // Show translucent grid
    show_grid(callback) {
        const context = this.state.context
        let grid = this.state.grid
        // Drawing horizontal
        let horizontal_grid_path = new Path2D()
        context.lineWidth = grid.horizontal.width
        context.strokeStyle = grid.horizontal.color
        for (let i = 1; i <= grid.horizontal.amount; ++i) {
            const y = this.state.figure.window_size.height * i / grid.horizontal.amount
            horizontal_grid_path.moveTo(0, y)
            horizontal_grid_path.lineTo(this.state.figure.window_size.width, y)
        }
        grid.horizontal.path = horizontal_grid_path
        context.stroke(horizontal_grid_path)
        // Drawing vertical
        let vertical_grid_path = new Path2D()
        context.lineWidth = grid.vertical.width
        context.strokeStyle = grid.vertical.color
        for (let i = 1; i <= grid.vertical.amount; ++i) {
            const x = this.state.figure.window_size.width * i / grid.vertical.amount
            vertical_grid_path.moveTo(x, 0)
            vertical_grid_path.lineTo(x, this.state.figure.window_size.height)
        }
        grid.vertical.path = vertical_grid_path
        context.stroke(vertical_grid_path)
        this.setState({grid: grid}, callback)
    }

    componentDidMount() {
        this.set_window()
        this.plot()
    }

    componentDidUpdate() {

    }

    render() {
        return (
            <canvas ref={this.canvas} style={{border: '1px solid black'}}>
                Canvas tag not supported by your browser.
            </canvas>
        )
    }
}
