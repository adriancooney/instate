import React, { Component } from "react";
import { connect } from "../../../";

@connect({ filter: "todos.filter" })
export default class Controls extends Component {
    render() {
        const filters = ["all", "completed"].map(filter => {
            return <li key={filter}><a href="#" onClick={this.changeFilter.bind(this, filter)}>
                {`${filter}${ filter === this.state.filter ? " (current)" : ""}`}
            </a></li>;
        });

        return (
            <div className="Controls">
                { filters }
            </div>
        );
    }

    changeFilter(filter) {
        // Update the filter on the current state which is proxied onto the global state
        this.setState({ filter });
    }
}