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
    }
    get_labels_font(density) { // Canvas formatted label style
        return `${this.labels.font.style} ${this.labels.font.size * density}px ${this.labels.font.fontFamily}`
    }
}


// Figure class containing main plot component data
class Figure {
    constructor() {
        this.window_size = {
            width: 600,
            height: 200,
        }
        this.plot_density = {
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
            color: '#002aff',
            width: 2
        }
    }
    // Canvas actual width
    get_width() {
        return this.window_size.width *
            (1 + this.padding.left + this.padding.right)
            * this.plot_density.width
    }
    // Canvas actual height
    get_height() {
        return this.window_size.height *
            (1 + this.padding.bottom + this.padding.top)
            * this.plot_density.height
    }
    // Window and canvas aspect ratio
    get_aspect_ratio() {
        return this.window_size.width / this.window_size.height
    }
    // Rescales original line width for proper display
    get_line_width() {
        return this.style.width * (this.plot_density.height + this.plot_density.width) / 2
    }
}


// Plot component allowing to draw charts using canvas tag
export default class Plot extends React.Component {
    constructor(props) {
        // Component data initialization
        super(props)
        this.state = {
            original_data: props.data,
            data: {},
            figure: new Figure(),
            axes: {
                x: new Axis(),
                y: new Axis(),
            },
            grid: {
                horizontalAmount: 10,
                verticalAmount: 10,
                color: '#d9d9d9',
                width: 1,
            }
        }
        this.type = props.type
        this.canvas = React.createRef()
        // Methods binding
        this.drawLine = this.drawLine.bind(this)
        this.show_axes = this.show_axes.bind(this)
        this.show_grid = this.show_grid.bind(this)
        this.setup_window = this.setup_window.bind(this)
    }
    // Linear transformation: X -> AX + X0
    transform_coordinates(callback) {
        // Data initialization
        let [x, y] = [[], []]
        const original_data = this.state.original_data
        // Sizes match check
        if (original_data.x.length !== original_data.y.length) {
            throw Error('Invalid coordinates transform. X and Y sizes do not match.')
        }
        // Window and canvas sizes proportion
        const [height_scale, width_scale] = [
            (Math.max.apply(null, original_data.y) - Math.min.apply(null, original_data.y))
            / (this.state.figure.window_size.height * this.state.figure.plot_density.height),
            (Math.max.apply(null, original_data.x) - Math.min.apply(null, original_data.x))
            / (this.state.figure.window_size.width * this.state.figure.plot_density.width)
        ]
        // Linear transformation choose depending on plot type
        switch (this.type) {
            case 'date_value':
                this.show_grid() // Translucent grid
                for (let i = 0; i < original_data.x.length; ++i) {
                    x.push(
                        this.state.axes.x.center +
                        i * this.state.figure.get_width() /
                        original_data.x.length
                    )
                    y.push(
                        this.state.axes.y.center -
                        original_data.y[i] / height_scale
                    )
                }
                break
            default:
                this.show_grid() // Translucent grid
                this.show_axes() // Axes and axes labels
                for (const [xi, yi] of zip(original_data.x, original_data.y)) {
                    x.push(this.state.axes.x.center + xi / width_scale)
                    y.push(this.state.axes.y.center - yi / height_scale)
                }
                break
        }
        // Applying changes
        this.setState({data: {x: x, y: y,}}, callback)
    }
    // Rescales window and canvas itself
    setup_window() {
        let canvas = this.canvas.current
        // Window
        canvas.style.width = `${this.state.figure.window_size.width}px`
        canvas.style.height = `${this.state.figure.window_size.height}px`
        // Canvas
        canvas.width = this.state.figure.get_width()
        canvas.height = this.state.figure.get_height()
    }
    // Draw line from point (x1, y1) to point (x2, y2)
    drawLine(x1, y1, x2, y2) {
        const context = this.canvas.current.getContext('2d')
        context.beginPath()
        context.lineWidth = this.state.figure.get_line_width()
        context.strokeStyle = this.state.figure.style.color
        context.moveTo(x1, x2)
        context.lineTo(x2, y2)
        context.stroke()
        context.closePath()
    }
    // Drawing plot depending on plot type
    plot() {
        let callback = null
        // Choosing callback method
        switch (this.type) {
            case 'date_value':
                callback = this.plot_date_value
                break
            case 'financial':
                callback = this.plot_financial
                break
            default:
                callback = this.plot_math
        }
        // Rescaling based on original input data
        this.set_scale(() => {
            this.setup_window() // Window density
            this.set_coordinates_system(() => { // New coordinates center
                this.transform_coordinates(callback) // original_data -> data
            })
        })
    }
    // Date-value type plot (<date:String>, <value:Number>)
    plot_date_value() {
        const data = this.state.data
        const context = this.canvas.current.getContext('2d')
        // Drawing plot
        context.beginPath()
        context.lineWidth = this.state.figure.get_line_width()
        context.strokeStyle = this.state.figure.style.color
        context.moveTo(data.x[0], data.y[0])
        for (const [x, y] of zip(data.x, data.y)) {
            context.lineTo(x, y)
        }
        context.stroke()
        context.closePath()
    }
    // Math type plot (<x:Number>, <y:Number>)
    plot_math() {
        const context = this.canvas.current.getContext('2d')
        // Drawing plot
        context.beginPath()
        context.lineWidth = this.state.figure.get_line_width()
        context.strokeStyle = this.state.figure.style.color
        context.moveTo(this.state.data.x[0], this.state.data.y[0])
        for (const [x, y] of zip(this.state.data.x, this.state.data.y)) {
            context.lineTo(x, y)
        }
        context.stroke()
        context.closePath()
    }
    // Financial type plot (
    //      <date:String>,
    //      (<open:Number>, <high:Number>, <low:Number>, <close:Number>, <volume:Number>)
    // )
    plot_financial() {

    }
    // Show coordinate axes and data labels
    show_axes() {
        // Data binding
        const x_axis = this.state.axes.x
        const y_axis = this.state.axes.y
        // Axes visibility check
        if (x_axis.visible || y_axis.visible) {
            const context = this.canvas.current.getContext('2d')
            context.beginPath()
            // Drawing horizontal (x)
            if (x_axis.visible) {
                // Style
                context.lineWidth = x_axis.width * this.state.figure.plot_density.height
                context.strokeStyle = x_axis.color
                // Axis line
                context.moveTo(0, y_axis.center)
                context.lineTo(this.state.figure.get_width(), y_axis.center)
                // Horizontal labels (width levels)
                if (x_axis.labels.visible) {
                    context.font = x_axis.get_labels_font(this.state.figure.plot_density.width)
                    context.fillStyle = x_axis.labels.color
                    for (let i = 1; i < x_axis.labels.amount; ++i) {
                        const x = this.state.figure.get_width() * i / x_axis.labels.amount
                        // Do not show center label to avoid overlapping
                        if (x - x_axis.center !== 0) { // Text
                            const sign_width = String(x - x_axis.center).length
                            const sign_height = x_axis.labels.font.size
                            context.fillText(
                                parseInt(x - x_axis.center),
                                x - sign_width * this.state.figure.plot_density.width / 2,
                                y_axis.center + sign_height * 1.5 * this.state.figure.plot_density.height
                            )
                        }
                        // Vertical hatch
                        context.moveTo(x, y_axis.center - 5 * this.state.figure.plot_density.height)
                        context.lineTo(x, y_axis.center + 5 * this.state.figure.plot_density.height)
                    }
                }
            }
            // Drawing vertical
            if (y_axis.visible) {
                // Style
                context.lineWidth = y_axis.width * this.state.figure.plot_density.width
                context.strokeStyle = y_axis.color
                // Axis line
                context.moveTo(x_axis.center, 0)
                context.lineTo(x_axis.center, this.state.figure.get_height())
                // Vertical labels (height levels)
                if (y_axis.labels.visible) {
                    context.font = y_axis.get_labels_font(this.state.figure.plot_density.width)
                    context.fillStyle = y_axis.labels.color
                    for (let i = 1; i < y_axis.labels.amount; ++i) {
                        const y = this.state.figure.get_height() * i / y_axis.labels.amount
                        // Do not show center label to avoid overlapping
                        if (y_axis.center - y !== 0) { // Text
                            const sign_width = String(y_axis.center - y).length
                            const sign_height = y_axis.labels.font.size
                            context.fillText(
                                parseInt(y_axis.center - y),
                                x_axis.center - sign_width * 1.3 * this.state.figure.plot_density.width,
                                y + sign_height * 0.8 * this.state.figure.plot_density.height / 2
                            )
                        }
                        // Horizontal hatch
                        context.moveTo(x_axis.center - 5 * this.state.figure.plot_density.width, y)
                        context.lineTo(x_axis.center + 5 * this.state.figure.plot_density.width, y)
                    }
                }
            }
            context.stroke()
            context.closePath()
        }
    }
    // Show translucent grid
    show_grid() {
        const context = this.canvas.current.getContext('2d')
        const grid = this.state.grid
        context.beginPath()
        context.lineWidth = grid.width * this.state.figure.plot_density.height
        context.strokeStyle = grid.color
        // Drawing horizontal
        for (let i = 1; i <= grid.horizontalAmount; ++i) {
            const y = this.state.figure.get_height() * i / grid.horizontalAmount
            context.moveTo(0, y)
            context.lineTo(this.state.figure.get_width(), y)
        }
        context.lineWidth = grid.width * this.state.figure.plot_density.width
        // Drawing vertical
        for (let i = 1; i <= grid.verticalAmount; ++i) {
            const x = this.state.figure.get_width() * i / grid.verticalAmount
            context.moveTo(x, 0)
            context.lineTo(x, this.state.figure.get_height())
        }
        context.stroke()
        context.closePath()
    }
    // Changing coordinates system center X0 = (x0, y0)
    set_coordinates_system(callback) {
        let axes = this.state.axes
        switch (this.type) {
            case 'date_value': // Window left bottom corner
                axes.x.center = this.state.figure.padding.left * this.state.figure.plot_density.width
                axes.y.center = Math.max.apply(null, this.state.original_data.y) +
                    this.state.figure.window_size.height * this.state.figure.padding.top *
                    this.state.figure.plot_density.height
                break
            default: // Window center
                axes.x.center = this.state.figure.get_width() / 2
                axes.y.center = this.state.figure.get_height() / 2
                // Setting labels amount depending on window size
                axes.x.labels.amount = parseInt(this.state.figure.window_size.width / 50)
                axes.y.labels.amount = parseInt(this.state.figure.window_size.height / 50)
                break
        }
        // Applying changes
        this.setState({axes: axes}, callback)
    }
    // Find the difference between window sizes and canvas sizes
    set_scale(callback) {
        let figure = this.state.figure
        // dy / window_height
        let height_scale = (Math.max.apply(null, this.state.original_data.y) -
            Math.min.apply(null, this.state.original_data.y)) / figure.window_size.height
        // [500; 1500] range hit
        while (height_scale * figure.window_size.height < 500 ||
        height_scale * figure.window_size.height > 1500) {
            if (height_scale * figure.window_size.height < 500) {
                height_scale *= 2
            } else if (height_scale * figure.window_size.height > 1500) {
                height_scale /= 2
            }
        }
        figure.plot_density.height = height_scale
        // Saving aspect ratio between window sizes and canvas sizes
        figure.plot_density.width = figure.window_size.height * height_scale * figure.get_aspect_ratio()
            / figure.window_size.width
        // Applying changes
        this.setState({figure: figure}, callback)
    }

    componentDidMount() { // Drawing plot
        this.set_coordinates_system(this.plot)
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
