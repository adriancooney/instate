import React, { Component } from "react";
import { state } from "../../../";

export default class AddTodo extends Component {
    render() {
        return (
            <div className="AddTodo">
                <h3>Add Todo</h3>
                <form onSubmit={::this.onSubmit}>
                    <input type="text" ref="todo" placeholder="Remember to.." />
                    <input type="submit" />
                </form>
            </div>
        );
    }

    onSubmit(event) {
        // Stop the page from refreshing
        event.preventDefault();

        // Since this component doesn't actually need the todo's in it's
        // state (by right, this should be a stateless component but we're
        // going to a class component to demonstrate the global state), we
        // just going to update the global state directly.
        state.update("todos.list", [...state.get("todos.list"), {
            text: this.refs.todo.value,
            completed: false
        }]);

        // Empty the input
        this.refs.todo.value = "";
    }
}