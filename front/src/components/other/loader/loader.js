import './loader.scss'

export function Loader({ fullScreen = false , size = 'md'}) {
    const containerClass = fullScreen
        ? 'loader-container loader-overlay'
        : 'loader-container'

    const loaderClass = `loader loader-${size}`

    return (
        <div className={containerClass}>
            <div className={loaderClass}>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
            </div>
        </div>
    )
}
