import React, { Component } from "react";
import { connect } from "../../../";

@connect({ todos: "todos.list", filter: "todos.filter" })
export default class TodoList extends Component {
    render() {
        // Here the global state of todos.list is automatically added to our
        // current state. All we need to do is just map over the todos.
        const todos = this.state.todos
            .filter(todo => this.state.filter === "all" || (this.state.filter === "completed" && todo.completed))
            .map((todo, i) => 
                <li key={i}>
                    <input type="checkbox" checked={todo.completed} onChange={this.toggle.bind(this, i)} /> 
                    { todo.text }
                </li>
            );

        return (
            <div className="TodoList">{ todos }</div>
        );
    }

    toggle(index, event) {
        this.setState({
            todos: this.state.todos.map((todo, i) => i === index ? {...todo, completed: event.target.checked } : todo)
        });
    }
}