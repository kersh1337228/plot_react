import React from 'react'


function zip(...args) {
    return [...args[0]].map((_, i) => args.map(arg => arg[i]))
}


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
                size: 20,
                fontFamily: 'Times New Roman'
            },
            color: '#000000'
        }
    }
    get_labels_font() {
        return `${this.labels.font.style} ${this.labels.font.size}px ${this.labels.font.fontFamily}`
    }
}


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
            left: 10,
            top: 10,
            right: 10,
            bottom: 10
        }
        this.style = {
            color: '#000000',
            width: 3
        }
    }

    get_width() {
        return (this.window_size.width +
                this.padding.left +
                this.padding.right) *
            this.plot_density.width
    }

    get_height() {
        return (this.window_size.height +
                this.padding.bottom +
                this.padding.top) *
            this.plot_density.height
    }
}


export default class Plot extends React.Component {
    constructor(props) {
        // React initialization
        super(props)
        this.state = {
            data: props.data,
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
        this.chart = this.chart.bind(this)
        this.drawLine = this.drawLine.bind(this)
        this.show_axes = this.show_axes.bind(this)
        this.show_grid = this.show_grid.bind(this)
        this.setup_window = this.setup_window.bind(this)
    }

    transform_coordinates(callback) {
        let [x, y] = [[], []]
        if (this.state.data.x.length !== this.state.data.y.length) {
            throw Error('Invalid coordinates transform. X and Y sizes do not match.')
        }
        for (const [xi, yi] of zip(this.state.data.x, this.state.data.y)) {
            x.push(this.state.axes.x.center + xi * 100)
            y.push(this.state.axes.y.center - yi * 100)
        }
        this.setState({
            data: {
                x: x,
                y: y,
            }
        }, callback)
    }

    setup_window() {
        let canvas = this.canvas.current
        canvas.style.width = `${this.state.figure.window_size.width}px`
        canvas.style.height = `${this.state.figure.window_size.height}px`
        canvas.width = this.state.figure.get_width()
        canvas.height = this.state.figure.get_height()
    }

    chart() {
        this.plot()
    }

    drawLine(x1, y1, x2, y2, color, width) {
        const context = this.canvas.current.getContext('2d')
        context.beginPath()
        context.lineWidth = width
        context.strokeStyle = color
        context.moveTo(x1, x2)
        context.lineTo(x2, this.state.height * this.state.dpi_height - y2)
        context.stroke()
        context.closePath()
    }

    plot() {
        switch (this.type) {
            case 'date_value':
                this.plot_data_value()
                break
            case 'financial':
                this.plot_financial()
                break
            default:
                this.plot_math()
        }
    }

    plot_math() {
        // Size correction
        let figure = this.state.figure
        figure.plot_density.width = figure.plot_density.height = Math.max(
            100 * (Math.max.apply(null, this.state.data.x) -
                Math.min.apply(null, this.state.data.x)) /
            figure.window_size.width,
            100 * (Math.max.apply(null, this.state.data.y) -
                Math.min.apply(null, this.state.data.y)) /
            figure.window_size.height,
        )
        this.setState({figure: figure}, () => {
            this.setup_window()
            this.set_coordinates_system(() => {
                this.show_grid()
                this.show_axes()
                this.transform_coordinates(() => {
                    // Drawing plot
                    const context = this.canvas.current.getContext('2d')
                    context.beginPath()
                    context.lineWidth = this.state.figure.style.width
                    context.strokeStyle = this.state.figure.style.color
                    context.moveTo(this.state.data.x[0], this.state.data.y[0])
                    for (const [x, y] of zip(this.state.data.x, this.state.data.y)) {
                        context.lineTo(x, y)
                    }
                    context.stroke()
                    context.closePath()
                })
            })
        })
    }

    plot_data_value() {

    }

    plot_financial() {

    }

    show_axes() {
        const x_axis = this.state.axes.x
        const y_axis = this.state.axes.y
        if (x_axis.visible || y_axis.visible) {
            const context = this.canvas.current.getContext('2d')
            context.beginPath()
            context.lineWidth = x_axis.width * this.state.figure.plot_density.height
            context.strokeStyle = x_axis.color
            // Drawing horizontal
            if (x_axis.visible) {
                context.moveTo(0, y_axis.center)
                context.lineTo(this.state.figure.get_width(), y_axis.center)
                // Horizontal labels
                if (x_axis.labels.visible) {
                    context.font = x_axis.get_labels_font()
                    context.fillStyle = x_axis.labels.color
                    for (let i = 1; i < x_axis.labels.amount; ++i) {
                        const x = this.state.figure.get_width() * i / x_axis.labels.amount
                        if (x - x_axis.center !== 0) {
                            const sign_width = String(x - x_axis.center).length * x_axis.levels.font.size
                            const sign_height = x_axis.levels.font.size
                            context.fillText(
                                parseInt(x - x_axis.center),
                                x - sign_width * this.state.figure.plot_density.width / 2,
                                y_axis.center + sign_height * this.state.figure.plot_density.height
                            )
                        }
                        context.moveTo(x, y_axis.center - 5 * this.state.figure.plot_density.height)
                        context.lineTo(x, y_axis.center + 5 * this.state.figure.plot_density.height)
                    }
                }
            }
            context.lineWidth = y_axis.width * this.state.figure.plot_density.width
            context.strokeStyle = y_axis.color
            // Drawing vertical
            if (y_axis.visible) {
                context.moveTo(x_axis.center, 0)
                context.lineTo(x_axis.center, this.state.figure.get_height())
                // Vertical labels
                if (y_axis.labels.visible) {
                    context.font = y_axis.get_labels_font()
                    context.fillStyle = y_axis.labels.color
                    for (let i = 1; i < y_axis.labels.amount; ++i) {
                        const y = this.state.figure.get_height() * i / y_axis.labels.amount
                        if (y_axis.center - y !== 0) {
                            const sign_width = String(y_axis.center - y).length * y_axis.levels.font.size
                            const sign_height = y_axis.levels.font.size
                            context.fillText(
                                parseInt(y_axis.center - y),
                                x_axis.center - sign_width * this.state.figure.plot_density.width,
                                y + sign_height * this.state.figure.plot_density.height / 2
                            )
                        }
                        context.moveTo(x_axis.center - 5 * this.state.figure.plot_density.width, y)
                        context.lineTo(x_axis.center + 5 * this.state.figure.plot_density.width, y)
                    }
                }
            }
            context.stroke()
            context.closePath()
        }
    }

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

    set_coordinates_system(callback) {
        switch (this.state.figure.type) {
            default:
                let axes = this.state.axes
                axes.x.center = this.state.figure.get_width() / 2
                axes.y.center = this.state.figure.get_height() / 2
                this.setState({axes: axes}, callback)
                break
        }
    }

    componentDidMount() {
        this.set_coordinates_system()
    }

    componentDidUpdate() {

    }

    render() {
        return (
            <canvas onClick={this.chart} ref={this.canvas} style={{border: '1px solid black'}}></canvas>
        )
    }
}
