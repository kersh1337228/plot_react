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
        window_size_width, window_size_height, padding_left=0,
        padding_top=0, padding_right=0, padding_bottom=0, style_width=1,
        grid_vertical_amount=10, grid_vertical_color='#000000', grid_vertical_width=1,
        grid_horizontal_amount=10, grid_horizontal_color='#000000', grid_horizontal_width=1,
        canvas_density=1
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
        this.style_width = style_width
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


// PlotFinancial component allowing to draw charts using canvas tag
export default class PlotFinancial extends React.Component {
    constructor(props) {
        // Component data initialization
        super(props)
        // Mutable data (influence on render)
        this.state = {
            data: props.data,
            figures: {
                main: new Figure(
                    850, 480,
                    0, 0.1, 0, 0.1,
                    1, 10, '#d9d9d9', 1,
                    10, '#d9d9d9', 1, 1
                ),
                volume: new Figure(
                    850, 192,
                    0, 0.1, 0, 0,
                    1, 10, '#d9d9d9', 1,
                    4, '#d9d9d9', 1, 1
                ),
                hit: new Figure(850, 672),
                dates: new Figure(850, 48, 0, 0.1)
            },
            tooltips: null,
            data_range: null,
        }
        // Data range navigation
        this.drag = {
            main: {
                state: false,
                position: {
                    x: 0,
                    y: 0
                }
            },
            dates: {
                state: false,
                position: {
                    x: 0,
                    y: 0
                }
            }
        }
        // UI events binding
        //// Main canvas
        this.mouseMoveHandlerMain = this.mouseMoveHandlerMain.bind(this)
        this.mouseOutHandlerMain = this.mouseOutHandlerMain.bind(this)
        this.mouseDownHandlerMain = this.mouseDownHandlerMain.bind(this)
        this.mouseUpHandlerMain = this.mouseUpHandlerMain.bind(this)
        //// Dates canvas
        this.mouseMoveHandlerDates = this.mouseMoveHandlerDates.bind(this)
        this.mouseOutHandlerDates = this.mouseOutHandlerDates.bind(this)
        this.mouseDownHandlerDates = this.mouseDownHandlerDates.bind(this)
        this.mouseUpHandlerDates = this.mouseUpHandlerDates.bind(this)
    }
    // Financial type plot (
    //      <date:String>,
    //      (<open:Number>, <high:Number>, <low:Number>, <close:Number>, <volume:Number>)
    // )
    plot(callback) {
        let state = this.state
        // Clear
        state.figures.main.context.clearRect(0, 0, state.figures.main.get_width(), state.figures.main.get_height())
        state.figures.volume.context.clearRect(0, 0, state.figures.volume.get_width(), state.figures.volume.get_height())
        state.figures.dates.context.clearRect(0, 0, state.figures.dates.get_width(), state.figures.dates.get_height())
        // Drawing grid on plot canvases
        this.show_grid(state.figures.main)
        this.show_grid(state.figures.volume)
        // Getting observed data range
        const n = Object.keys(state.data).length
        const data = Object.fromEntries(
            Object.entries(state.data).slice(
                Math.floor(n * state.data_range.start),
                Math.ceil(n * state.data_range.end)
            )
        )
        // Rescaling
        const [lows, highs, volumes] = [
            Array.from(Object.values(data), obj => obj.low),
            Array.from(Object.values(data), obj => obj.high),
            Array.from(Object.values(data), obj => obj.volume),
        ]
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
        const data_amount = Object.keys(data).length
        for (let i = 0; i < data_amount; ++i) {
            const {open, high, low, close, volume} = Object.values(data)[i]
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
        // Drawing dates
        state.figures.dates.context.beginPath()
        state.figures.dates.context.strokeStyle = '#000000'
        // Drawing axis
        state.figures.dates.context.moveTo(
            0,
            state.figures.dates.get_height() * state.figures.dates.padding.top
        )
        state.figures.dates.context.lineTo(
            state.figures.dates.get_width(),
            state.figures.dates.get_height() * state.figures.dates.padding.top
        )
        state.figures.dates.context.stroke()
        state.figures.dates.context.closePath()
        // Drawing data notches and dates
        const step = Math.floor(data_amount * 0.1)
        for (let i = step; i < data_amount - step; i+=step) {
            state.figures.dates.context.beginPath()
            state.figures.dates.context.moveTo(
                (2 * i + 1.1) * state.figures.main.scale.width / 2,
                state.figures.dates.get_height() * state.figures.dates.padding.top
            )
            state.figures.dates.context.lineTo(
                (2 * i + 1.1) * state.figures.main.scale.width / 2,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.1)
            )
            state.figures.dates.context.stroke()
            state.figures.dates.context.closePath()
            state.figures.dates.context.font = '10px Arial'
            state.figures.dates.context.fillText(
                Object.keys(data)[i],
                (2 * i + 1.1) * state.figures.main.scale.width / 2 - 25,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.3)
            )
        }
        state.figures.main.context.restore()
        state.figures.volume.context.restore()
        this.setState(state, callback)
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
    // Mouse events
    //// Main canvas
    // Draws coordinate pointer and tooltips if mouse pointer is over canvas
    mouseMoveHandlerMain(event) {
        const [x, y] = [ // Getting current in-object coordinates
            event.clientX - event.target.offsetLeft,
            event.clientY - event.target.offsetTop
        ]
        if (this.drag.main.state) { // If mouse is held moves data range
            const x_offset = ((event.clientX - event.target.offsetLeft) - this.drag.main.position.x) / (this.state.figures.hit.get_width() * 200)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving window to the left and data range to the right
                    data_range.end = data_range.end - x_offset >= 1 ? 1 : data_range.end - x_offset
                    data_range.start = data_range.end - (this.state.data_range.end - this.state.data_range.start)
                } else if (x_offset > 0) { // Moving window to the right and data range to the left
                    data_range.start = data_range.start - x_offset <= 0 ? 0 : data_range.start - x_offset
                    data_range.end = data_range.start + (this.state.data_range.end - this.state.data_range.start)
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start && data_range.end !== this.state.data_range.end) {
                    this.setState({data_range: data_range}, () => {
                        this.plot() // Redrawing plot with new data range
                    })
                }
            }
        }
        // Getting observed data range
        const n = Object.keys(this.state.data).length
        const data = Object.fromEntries(
            Object.entries(this.state.data).slice(
                Math.floor(n * this.state.data_range.start),
                Math.ceil(n * this.state.data_range.end)
            )
        )
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        context.beginPath()
        // Drawing horizontal line
        context.moveTo(0, y)
        context.lineTo(this.state.figures.hit.get_width(), y)
        // Segment hit check
        const segment_width = this.state.figures.hit.get_width() / Object.keys(data).length
        const i = Math.floor(x / segment_width)
        // Drawing vertical line
        context.moveTo((2 * i + 1.1) * segment_width / 2, 0)
        context.lineTo((2 * i + 1.1) * segment_width / 2, this.state.figures.hit.get_height())
        context.stroke()
        context.closePath()
        // Data tooltips
        const [date, {open, high, low, close, volume}] = Object.entries(data)[i]
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
    mouseOutHandlerMain() {
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        this.setState({tooltips: null})
    }
    // Date range drag change
    mouseDownHandlerMain(event) {
        this.drag.main = {
            state: true,
            position: {
                x: event.clientX - event.target.offsetLeft,
                y: event.clientY - event.target.offsetTop,
            }
        }
    }
    // Mouse hold off
    mouseUpHandlerMain() {
        this.drag.main.state = false
    }
    //// Dates canvas
    mouseMoveHandlerDates(event) {
        if (this.drag.dates.state) { // If mouse is held moves data range
            const x_offset = (this.drag.dates.position.x - (event.clientX - event.target.offsetLeft)) / (this.state.figures.dates.get_width() * 200)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving data range start to the left
                    data_range.start = data_range.start + x_offset <= 0 ?
                        0 : data_range.end - (data_range.start + x_offset) > 0.15 ?
                            data_range.start : data_range.start + x_offset
                } else if (x_offset > 0) { // Moving data range start to the end
                    data_range.start = data_range.end - (data_range.start + x_offset) < 0.005 ?
                        data_range.start : data_range.start + x_offset
                } // Check if changes are visible (not visible on bounds)
                console.log(data_range)
                if (data_range.start !== this.state.data_range.start) {
                    this.setState({data_range: data_range}, () => {
                        this.plot() // Redrawing plot with new data range
                    })
                }
            }
        }
    }
    mouseOutHandlerDates() {

    }
    mouseDownHandlerDates(event) {
        this.drag.dates = {
            state: true,
            position: {
                x: event.clientX - event.target.offsetLeft,
                y: event.clientY - event.target.offsetTop,
            }
        }
    }
    mouseUpHandlerDates() {
        this.drag.dates.state = false
    }
    // After-render plot building
    componentDidMount() {
        let state = this.state
        // Setting contexts
        state.figures.main.context = state.figures.main.canvas.current.getContext('2d')
        state.figures.volume.context = state.figures.volume.canvas.current.getContext('2d')
        state.figures.hit.context = state.figures.hit.canvas.current.getContext('2d')
        state.figures.dates.context = state.figures.dates.canvas.current.getContext('2d')
        // Setting windows and canvases sizes
        state.figures.main.set_window()
        state.figures.volume.set_window()
        state.figures.hit.set_window()
        state.figures.dates.set_window()
        // Setting basic observed data range
        const data_amount = Object.keys(state.data).length
        const default_data_amount = Math.floor(state.figures.main.window_size.width / 8.5)
        state.data_range = {
            start: 1 - (data_amount <= default_data_amount ? data_amount : default_data_amount) / data_amount,
            end: 1
        }
        // Applying changes and calling drawing method
        this.setState(state, this.plot)
    }

    componentDidUpdate() {

    }

    render() {
        const tooltips = this.state.tooltips ?
            <div className={'plot_financial_tooltips'}>
                <span>Date: {this.state.tooltips.date}</span>
                <span>Open: {this.state.tooltips.open}</span>
                <span>High: {this.state.tooltips.high}</span>
                <span>Low: {this.state.tooltips.low}</span>
                <span>Close: {this.state.tooltips.close}</span>
                <span>Volume: {this.state.tooltips.volume}</span>
            </div> : null
        return (
            <>
                {tooltips}
                <div className={'plot_financial_grid'}>
                    <canvas
                        ref={this.state.figures.main.canvas}
                        className={'canvas_main'}
                    >
                        Canvas tag is not supported by your browser.
                    </canvas>
                    <canvas
                        ref={this.state.figures.volume.canvas}
                        className={'canvas_volume'}
                    >
                        Canvas tag is not supported by your browser.
                    </canvas>
                    <canvas
                        ref={this.state.figures.hit.canvas}
                        onMouseMove={this.mouseMoveHandlerMain}
                        onMouseOut={this.mouseOutHandlerMain}
                        onMouseDown={this.mouseDownHandlerMain}
                        onMouseUp={this.mouseUpHandlerMain}
                        className={'canvas_hit'}
                    >
                        Canvas tag is not supported by your browser.
                    </canvas>
                    <canvas
                        ref={this.state.figures.dates.canvas}
                        className={'canvas_dates'}
                        onMouseMove={this.mouseMoveHandlerDates}
                        onMouseOut={this.mouseOutHandlerDates}
                        onMouseDown={this.mouseDownHandlerDates}
                        onMouseUp={this.mouseUpHandlerDates}>
                        Canvas tag is not supported by your browser.
                    </canvas>
                </div>
            </>
        )
    }
}
