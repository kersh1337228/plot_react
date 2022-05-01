import React from 'react'
import './plot.css'


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
    }
    get_labels_font(density) { // Canvas formatted label style
        return `${this.labels.font.style} ${this.labels.font.size * density}px ${this.labels.font.fontFamily}`
    }
}


// Figure class containing main plot component data
class Figure {
    constructor(
        window_size_width, window_size_height, padding_left,
        padding_top, padding_right, padding_bottom, style_color, style_width,
        grid_vertical_amount, grid_vertical_color, grid_vertical_width,
        grid_horizontal_amount, grid_horizontal_color, grid_horizontal_width,
        canvas_density
    ) {
        this.window_size = {
            width: window_size_width,
            height: window_size_height,
        }
        this.scale = {
            width: 1,
            height: 1,
        }
        this.padding = {
            left: padding_left,
            top: padding_top,
            right: padding_right,
            bottom: padding_bottom
        }
        this.style = {
            color: style_color,
            width: style_width
        }
        this.axes = {
            x: new Axis(),
            y: new Axis(),
        }
        this.grid = {
            vertical: {
                amount: grid_vertical_amount,
                color: grid_vertical_color,
                width: grid_vertical_width,
            },
            horizontal: {
                amount: grid_horizontal_amount,
                color: grid_horizontal_color,
                width: grid_horizontal_width,
            },
        }
        this.canvas = React.createRef()
        this.context = null
        this.canvas_density = canvas_density
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
    set_window() {
        this.canvas.current.style.width = `${this.window_size.width}px`
        this.canvas.current.style.height = `${this.window_size.height}px`
        this.canvas.current.width = this.get_width()
        this.canvas.current.height = this.get_height()
    }
}


// Plot component allowing to draw charts using canvas tag
export default class Plot extends React.Component {
    constructor(props) {
        // Component data initialization
        super(props)
        this.state = {
            data: props.data,
            figures: {
                main: new Figure(
                    850, 480,
                    0, 0.1, 0, 0.1,
                    '#ff0000', 2, 10, '#d9d9d9',
                    1, 10, '#d9d9d9', 1, 25

                ),
                volume: new Figure(
                    850, 192,
                    0, 0.1, 0, 0,
                    '#ff0000', 2, 10, '#d9d9d9',
                    1, 4, '#d9d9d9', 1, 25
                ),
                hit: new Figure(
                    850, 672,
                    0, 0, 0, 0,
                    '#ff0000', 2, 10, '#d9d9d9',
                    1, 4, '#d9d9d9', 1, 1
                )
            },
            tooltips: null
        }
        this.type = props.type
        this.mouseMoveHandler = this.mouseMoveHandler.bind(this)
        this.mouseOutHandler = this.mouseOutHandler.bind(this)
    }
    // Date-value type plot (<date:String>, <value:Number>)
    plot_date_value() {
        let state = this.state
        const balance = Array.from(this.state.data, obj => obj.balance)
        // Rescaling
        state.figures.main.scale.height = (state.figures.main.get_height() * (1 - state.figures.main.padding.bottom - state.figures.main.padding.top)) /
            Math.abs(Math.max.apply(null, balance) - Math.min.apply(null, balance))
        state.figures.main.scale.width = (state.figures.main.get_width() * (1 - state.figures.main.padding.left - state.figures.main.padding.right)) / (balance.length - 1)
        // Moving coordinates system
        state.figures.main.axes.y.center = Math.max.apply(null, balance) *
            state.figures.main.scale.height + state.figures.main.padding.top * state.figures.main.get_height()
        state.figures.main.axes.x.center = state.figures.main.padding.left * state.figures.main.window_size.width
        state.context.save()
        state.context.translate(state.figures.main.axes.x.center, state.figures.main.axes.y.center)
        state.context.scale(state.figures.main.scale.width, -state.figures.main.scale.height)
        // Drawing plot
        state.context.lineWidth = state.figures.main.get_line_width()
        state.context.strokeStyle = state.figures.main.style.color
        state.context.lineJoin = 'round'
        state.context.beginPath()
        state.context.moveTo(0, state.balance[0])
        for (let i = 1; i < state.balance.length; ++i) {
            state.context.lineTo(i, state.balance[i])
        }
        state.context.stroke()
        state.context.closePath()
        // Saving figures.main path
        state.context.restore() // Restoring context
        this.setState(state)
    }
    // Financial type plot (
    //      <date:String>,
    //      (<open:Number>, <high:Number>, <low:Number>, <close:Number>, <volume:Number>)
    // )
    plot_financial() {
        let state = this.state
        const [lows, highs, volumes] = [
            Array.from(Object.values(this.state.data), obj => obj.low),
            Array.from(Object.values(this.state.data), obj => obj.high),
            Array.from(Object.values(this.state.data), obj => obj.volume),
        ]
        // Rescaling
        //// Main
        state.figures.main.scale.height = (
            state.figures.main.get_height() * (1 - state.figures.main.padding.bottom - state.figures.main.padding.top)) /
            Math.abs(Math.max.apply(null, highs) - Math.min.apply(null, lows))
        state.figures.main.scale.width = state.figures.volume.scale.width = (
            state.figures.main.get_width() * (1 - state.figures.main.padding.left - state.figures.main.padding.right)) / (highs.length)
        //// Volume
        state.figures.volume.scale.height = (
            state.figures.volume.get_height() * (1 - state.figures.volume.padding.bottom - state.figures.volume.padding.top)) /
            Math.abs(Math.max.apply(null, volumes) - Math.min.apply(null, volumes))
        // Moving coordinates system
        //// Main
        state.figures.main.axes.y.center = Math.max.apply(null, highs) *
            state.figures.main.scale.height + state.figures.main.padding.top * state.figures.main.get_height()
        state.figures.main.axes.x.center = state.figures.main.padding.left * state.figures.main.window_size.width
        state.figures.main.context.save()
        state.figures.main.context.translate(state.figures.main.axes.x.center, state.figures.main.axes.y.center)
        state.figures.main.context.scale(1, -state.figures.main.scale.height)
        //// Volume
        state.figures.volume.axes.y.center = Math.max.apply(null, volumes) *
            state.figures.volume.scale.height + state.figures.volume.padding.top * state.figures.volume.get_height()
        state.figures.volume.axes.x.center = state.figures.volume.padding.left * state.figures.volume.window_size.width
        state.figures.volume.context.save()
        state.figures.volume.context.translate(state.figures.volume.axes.x.center, state.figures.volume.axes.y.center)
        state.figures.volume.context.scale(1, -state.figures.volume.scale.height)
        // Drawing plots
        state.figures.main.context.lineJoin = 'round'
        const data = Object.values(state.data)
        for (let i = 0; i < data.length; ++i) {
            const {open, high, low, close, volume} = data[i]
            const style = close - open > 0 ? '#53e9b5' : '#da2c4d'
            // Candle
            state.figures.main.context.beginPath()
            state.figures.main.context.strokeStyle = style
            state.figures.main.context.moveTo((2 * i + 1.1) * state.figures.main.scale.width / 2, low)
            state.figures.main.context.lineTo((2 * i + 1.1) * state.figures.main.scale.width / 2, high)
            state.figures.main.context.stroke()
            state.figures.main.context.fillStyle = style
            state.figures.main.context.fillRect(
                (i + 0.1) * this.state.figures.main.scale.width ,
                open,
                this.state.figures.main.scale.width * 0.9,
                close - open
            )
            state.figures.main.context.closePath()
            // Volume
            state.figures.volume.context.fillStyle = style
            state.figures.volume.context.fillRect(
                (i + 0.1) * this.state.figures.main.scale.width ,
                0,
                this.state.figures.volume.scale.width * 0.9,
                volume
            )
        }
        state.figures.main.context.restore()
        state.figures.volume.context.restore()
        this.setState(state)
    }
    // Show translucent grid
    show_grid(figure) {
        const context = figure.context
        // Drawing horizontal
        context.lineWidth = figure.grid.horizontal.width * figure.canvas_density
        context.strokeStyle = figure.grid.horizontal.color
        context.beginPath()
        for (let i = 1; i <= figure.grid.horizontal.amount; ++i) {
            const y = figure.get_height() * i / figure.grid.horizontal.amount
            context.moveTo(0, y)
            context.lineTo(this.state.figures.main.get_width(), y)
        }
        context.stroke()
        context.closePath()
        // Drawing vertical
        context.lineWidth = figure.grid.vertical.width * figure.canvas_density
        context.strokeStyle = figure.grid.vertical.color
        context.beginPath()
        for (let i = 1; i <= figure.grid.vertical.amount; ++i) {
            const x = figure.get_width() * i / figure.grid.vertical.amount
            context.moveTo(x, 0)
            context.lineTo(x, figure.get_height())
        }
        context.stroke()
        context.closePath()
    }

    plot() {
        let state = this.state
        state.figures.main.context = state.figures.main.canvas.current.getContext('2d')
        state.figures.main.set_window()
        state.figures.hit.context = state.figures.hit.canvas.current.getContext('2d')
        state.figures.hit.set_window()
        this.show_grid(state.figures.main)
        switch (this.type) {
            case 'date_value':
                this.plot_date_value()
                break
            case 'financial':
                state.figures.volume.context = state.figures.volume.canvas.current.getContext('2d')
                state.figures.volume.set_window()
                this.show_grid(state.figures.volume)
                this.plot_financial()
                break
        }
        this.setState(state)
    }
    // Draws coordinate pointer and tooltips if mouse pointer is over canvas
    mouseMoveHandler(event) {
        const [x, y] = [
            event.clientX - event.target.offsetLeft,
            event.clientY - event.target.offsetTop
        ]
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        context.beginPath()
        // Drawing horizontal line
        context.moveTo(0, y)
        context.lineTo(this.state.figures.hit.get_width(), y)
        // Drawing vertical line
        // Segment hit check
        const segment_width = this.state.figures.hit.get_width() / Object.keys(this.state.data).length
        const i = Math.floor(x / segment_width)
        context.moveTo((2 * i + 1) * segment_width / 2, 0)
        context.lineTo((2 * i + 1) * segment_width / 2, this.state.figures.hit.get_height())
        context.stroke()
        context.closePath()
        // Data tooltips
        const [date, {open, high, low, close, volume}] = Object.entries(this.state.data)[i]
        this.setState({tooltips: {
            date: date,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume,
        }})
    }
    // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
    mouseOutHandler() {
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        this.setState({tooltips: null})
    }
    // After-render plot building
    componentDidMount() {
        this.plot()
    }

    componentDidUpdate() {

    }

    render() {
        const tooltips = this.state.tooltips ?
            this.type === 'date_value' ?
            <div className={'plot_date_value_tooltips'}>
            </div> :
            <div className={'plot_financial_tooltips'}>
                <span>Date: {this.state.tooltips.date}</span>
                <span>Open: {this.state.tooltips.open}</span>
                <span>High: {this.state.tooltips.high}</span>
                <span>Low: {this.state.tooltips.low}</span>
                <span>Close: {this.state.tooltips.close}</span>
                <span>Volume: {this.state.tooltips.volume}</span>
            </div> : null
        const plot = this.type === 'date_value' ?
            <div className={'plot_date_value_grid'}>
                <canvas ref={this.state.figures.main.canvas} className={'canvas_main'}>
                    Canvas tag is not supported by your browser.
                </canvas>
                <canvas ref={this.state.figures.hit.canvas} onMouseMove={this.mouseMoveHandler}
                        onMouseOut={this.mouseOutHandler} className={'canvas_hit'}>
                    Canvas tag is not supported by your browser.
                </canvas>
            </div> :
            <div className={'plot_financial_grid'}>
                <canvas ref={this.state.figures.main.canvas} className={'canvas_main'}>
                    Canvas tag is not supported by your browser.
                </canvas>
                <canvas ref={this.state.figures.volume.canvas} className={'canvas_volume'}>
                    Canvas tag is not supported by your browser.
                </canvas>
                <canvas ref={this.state.figures.hit.canvas} onMouseMove={this.mouseMoveHandler}
                        onMouseOut={this.mouseOutHandler} className={'canvas_hit'}>
                    Canvas tag is not supported by your browser.
                </canvas>
            </div>
        return (
            <>
                {tooltips}
                {plot}
            </>
        )
    }
}
