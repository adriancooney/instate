import React, { Component } from "react";
import { hashHistory } from "react-router";
import { connect } from "../../../";

@connect({ user: "user" })
export default class Login extends Component {
    render() {
        return (
            <div className="Login">
                <input type="text" ref="username" placeholder="Username" defaultValue="root"/>
                <input type="password" ref="password" placeholder="Password" defaultValue="root"/>
                <button onClick={::this.onSubmit}>Submit</button>
            </div>
        );
    }

    onSubmit() {
        const username = this.refs.username.value;
        const password = this.refs.password.value;

        console.log("Attempting to login with %s:%s", username, password);
        login(username, password).then(user => {
            console.log("Login successful. Setting `user` key in state.");
            // Now the user is proxied onto the global state
            this.setState({ user });

            hashHistory.push("/");
        }).catch(error => {
            // Have your own local state (not recommended however for stable testing)
            this.setState({ error: error });
        });
    }
}

// Simulate login with API
function login(username, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(username == "root" && password == "root") {
                // Pass
                resolve({ username, name: "Adrian", email: "cooney.adrian@gmail.com" });
            } else {
                // Login fail
                reject(new Error("Incorrect user details."));
            }
        }, 1000);
    });
}