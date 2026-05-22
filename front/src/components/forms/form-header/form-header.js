import "./form-header.scss"
import PropTypes from "prop-types";

FormHeader.propTypes = {
    title: PropTypes.string.isRequired,
}

export function FormHeader({
    title,
}) {

    return (
        <div className="form-header">
            <div className="form-header-container">
                <h1>{title}</h1>
            </div>
            <hr/>
        </div>
    )
}