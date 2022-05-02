import React from 'react'
import './PlotDateValue.css'


// Figure class containing main plot component data
class Figure {
    constructor(
        window_size_width, window_size_height,
        padding_left=0, padding_top=0, padding_right=0, padding_bottom=0,
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
        this.axes = {
            x: 0,
            y: 0,
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
        this.state = {
            data: props.data,
            figures: {
                main: new Figure(
                    850, 480,
                    0, 0.1, 0, 0.1,
                    10, '#d9d9d9', 1,
                    10, '#d9d9d9', 1,
                    1

                ),
                hit: new Figure(850, 480),
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
        this.mouseDownHandlerDates = this.mouseDownHandlerDates.bind(this)
        this.mouseUpHandlerDates = this.mouseUpHandlerDates.bind(this)
    }
    // Date-value type plot (<date:String>, <value:Number>)
    plot(callback) {
        let state = this.state
        // Clear
        state.figures.main.context.clearRect(0, 0, state.figures.main.get_width(), state.figures.main.get_height())
        state.figures.dates.context.clearRect(0, 0, state.figures.dates.get_width(), state.figures.dates.get_height())
        // Drawing grid on plot canvases
        this.show_grid(state.figures.main)
        // Getting observed data range
        const n = state.data.length
        const data = state.data.slice(
            Math.floor(n * state.data_range.start),
            Math.ceil(n * state.data_range.end)
        )
        const data_amount = data.length
        // Rescaling
        const cost = Array.from(data, obj => obj.cost)
        state.figures.main.scale.height = (state.figures.main.get_height() * (1 - state.figures.main.padding.bottom - state.figures.main.padding.top)) /
            Math.abs(Math.max.apply(null, cost) - Math.min.apply(null, cost))
        state.figures.main.scale.width = (state.figures.main.get_width() * (1 - state.figures.main.padding.left - state.figures.main.padding.right)) / (data_amount - 1)
        // Moving coordinates system
        state.figures.main.axes.y = Math.max.apply(null, cost) *
            state.figures.main.scale.height + state.figures.main.padding.top * state.figures.main.get_height()
        state.figures.main.axes.x = state.figures.main.padding.left * state.figures.main.get_width()
        state.figures.main.context.save()
        state.figures.main.context.translate(state.figures.main.axes.x, state.figures.main.axes.y)
        state.figures.main.context.scale(1, -state.figures.main.scale.height)
        // Drawing plot
        state.figures.main.context.strokeStyle = '#000000'
        // state.figures.main.context.lineWidth = 1
        state.figures.main.context.beginPath()
        state.figures.main.context.moveTo(0, cost[0])
        for (let i = 1; i < data_amount; ++i) {
            state.figures.main.context.lineTo(i * state.figures.main.scale.width, cost[i])
        }
        state.figures.main.context.stroke()
        state.figures.main.context.closePath()
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
        const step = Math.ceil(data_amount * 0.1)
        for (let i = step; i < data_amount - step; i+=step) {
            state.figures.dates.context.beginPath()
            state.figures.dates.context.moveTo(
                i * state.figures.main.scale.width,
                state.figures.dates.get_height() * state.figures.dates.padding.top
            )
            state.figures.dates.context.lineTo(
                i * state.figures.main.scale.width,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.1)
            )
            state.figures.dates.context.stroke()
            state.figures.dates.context.closePath()
            state.figures.dates.context.font = '10px Arial'
            state.figures.dates.context.fillText(
                data[i].date,
                i * state.figures.main.scale.width - 25,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.3)
            )
        }
        // Restoring context
        state.figures.main.context.restore()
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
        const [x, y] = [
            event.clientX - event.target.offsetLeft,
            event.clientY - event.target.offsetTop
        ]
        if (this.drag.main.state) { // If mouse is held moves data range
            const x_offset = ((event.clientX - event.target.offsetLeft) - this.drag.main.position.x) /
                (this.state.figures.hit.get_width() * 200)
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
        const n = this.state.data.length
        const data = this.state.data.slice(
            Math.floor(n * this.state.data_range.start),
            Math.ceil(n * this.state.data_range.end)
        )
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        context.beginPath()
        // Drawing horizontal line
        context.moveTo(0, y)
        context.lineTo(this.state.figures.hit.get_width(), y)
        // Drawing vertical line
        // Segment hit check
        const segment_width = this.state.figures.hit.get_width() / data.length
        const i = Math.floor(x / segment_width)
        context.moveTo(i * this.state.figures.main.scale.width, 0)
        context.lineTo(i * this.state.figures.main.scale.width, this.state.figures.hit.get_height())
        context.stroke()
        context.closePath()
        // Data tooltips
        const {date, cost, balance, stocks} = data[i]
        // Drawing data point
        context.beginPath()
        context.arc(
            i * this.state.figures.main.scale.width,
            this.state.figures.main.axes.y - cost * this.state.figures.main.scale.height,
            0.005 * this.state.figures.hit.get_width(),
            0,
            2 * Math.PI
        )
        context.stroke()
        context.closePath()
        this.setState({tooltips: {
                date: date,
                cost: cost,
                balance: balance,
                stocks: stocks,
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
            console.log(x_offset)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving data range start to the left
                    data_range.start = data_range.start + x_offset <= 0 ?
                        0 : (data_range.end - (data_range.start + x_offset)) * this.state.data.length > 100 ?
                            data_range.start : data_range.start + x_offset
                } else if (x_offset > 0) { // Moving data range start to the end
                    data_range.start = (data_range.end - (data_range.start + x_offset)) * this.state.data.length < 5 ?
                        data_range.start : data_range.start + x_offset
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start) {
                    this.setState({data_range: data_range}, () => {
                        this.plot() // Redrawing plot with new data range
                    })
                }
            }
        }
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
        state.figures.hit.context = state.figures.hit.canvas.current.getContext('2d')
        state.figures.dates.context = state.figures.dates.canvas.current.getContext('2d')
        // Setting windows and canvases sizes
        state.figures.main.set_window()
        state.figures.hit.set_window()
        state.figures.dates.set_window()
        // Setting basic observed data range
        const data_amount = state.data.length
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
            <div className={'plot_date_value_tooltips'}>
                <span>Date: {this.state.tooltips.date}</span>
                <span>Cost: {this.state.tooltips.cost}</span>
                <span>Balance: {this.state.tooltips.balance}</span>
                <span>Stocks: {this.state.tooltips.stocks}</span>
            </div> : null
        return (
            <>
                {tooltips}
                <div className={'plot_date_value_grid'}>
                    <canvas
                        ref={this.state.figures.main.canvas}
                        className={'canvas_main'}
                    >
                        Canvas tag is not supported by your browser.
                    </canvas>
                    <canvas
                        ref={this.state.figures.hit.canvas}
                        className={'canvas_hit'}
                        onMouseMove={this.mouseMoveHandlerMain}
                        onMouseOut={this.mouseOutHandlerMain}
                        onMouseDown={this.mouseDownHandlerMain}
                        onMouseUp={this.mouseUpHandlerMain}
                    >
                        Canvas tag is not supported by your browser.
                    </canvas>
                    <canvas
                        ref={this.state.figures.dates.canvas}
                        className={'canvas_dates'}
                        onMouseMove={this.mouseMoveHandlerDates}
                        onMouseDown={this.mouseDownHandlerDates}
                        onMouseUp={this.mouseUpHandlerDates}
                    >
                        Canvas tag is not supported by your browser.
                    </canvas>
                </div>
            </>
        )
    }
}
