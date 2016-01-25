import React, { Component } from "react";
import { render } from "react-dom";
import { Router, Route, IndexRoute, Link, hashHistory } from "react-router";

import Login from "./components/Login";
import Home from "./components/Home";
import Profile from "./components/Profile";

import { state, connect } from "../../";

// Connect the path "user" on the global state
// to the local component state. Any updates
// within the component state are then mapped
// to the global state.
@connect({ user: "user" })
export default class App extends Component {
    render() {
        let nav = [
            <li><Link to="/">Home</Link></li>,
            <li><Link to="/profile">Profile</Link></li>
        ];

        let message = null;

        if(this.state.user) {
            message = `Hello there ${this.state.user.name}`;
            nav.push(<li><Link to="/logout">Logout</Link></li>);
        } else {
            message = "Hi there. Please login.";
            nav.push(<li><Link to="/login">Login</Link></li>);
        }

        return (
            <div className="App">
                { nav }
                <h3>{ message }</h3>
                { this.props.children }
            </div>
        );
    }
}

// Listen to any changes and log them to the cnsol
state.subscribe((path, value, state) => {
    console.group(`Update to '${path}':`);
    console.log("Value: ", value);
    console.log("State: ", state);
    console.groupEnd();
});

function authorize(nextState, replace) {
    let user = state.get("user");
    if(!user) replace("/login");
}

function logout(nextState, replace) {
    state.delete("user");
    replace("/login");
}

render((
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <Route path="login" component={Login} />
            <Route path="logout" onEnter={logout} />
            <Route path="profile" component={Profile} onEnter={authorize} />
            <IndexRoute component={Home} onEnter={authorize}/>
        </Route>
    </Router>
), document.getElementById("app"));