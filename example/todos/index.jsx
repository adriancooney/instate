import React, { Component } from "react";
import { render } from "react-dom";
import { state, connect } from "../../";

import { AddTodo, Controls, TodoList } from "./components";

function App() {
    return (
        <div>
            <TodoList />
            <AddTodo />
            <Controls />
        </div>
    );
}

// Set the initial state of the app
state.setState({
    todos: {
        list: [],
        filter: "all"
    }
});

// Listen to any changes and log them to the cnsol
state.subscribe((path, value, state) => {
    console.group(`Update to '${path}':`);
    console.log("Value: ", value);
    console.log("State: ", state);
    console.groupEnd();
});

render(<App />, document.getElementById("app"));