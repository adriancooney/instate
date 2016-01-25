import React, { Component } from "react";
import { connect } from "../../../";

@connect({ user: "user" })
export default class Profile extends Component {
    render() {
        return (
            <div className="Profile">
                <pre>{ JSON.stringify(this.state, null, 2) }</pre>
                <div>
                    <input type="text" ref="name" placeholder="Name" onChange={::this.onChange} value={this.state.user.name}/>
                </div>
            </div>
        );
    }

    onChange() {
        this.setState({
            user: { ...this.state.user, name: this.refs.name.value }
        });
    }
}