# Instate
Instate is an application state manager built for React and based loosely on the popular Redux library. At it's core, Instate is a single, global application state that you map to your components.

For example:
```js
import React, { Component } from "react":
import { connect, state } from "instate";

/* Set out initial, global state */
state.setState({ 
    user: {
        isLoggedIn: false
    }
});

/* Map the global state "user" property to the local application state property "user" */
@connect({ user: "user" })
class App extends Component {
    render() {
        if(this.state.user.isLoggedIn) {
            return (<p>Hello there user!</p>);
        } else {
            return (<p>Hello there. Please login.</p>);
        }
    }
}
```

Any updates to the local state will then be proxied onto the global state. Simple as that. For more detailed examples, take a look in the [`examples/` directory](example/) or to see a live version, visit [the todo app](https://adriancooney.github.io/instate/example/todos) or [a simple login flow app](https://adriancooney.github.io/instate/example/login-flow).

## Features
* Directly connect your React components to the global state with zero hassle.
* Exported state singleton which can be imported anywhere and always reference the global state.
* Framework/library agnostic. Instate comes with React bindings but can work with any library.
* State mutations are just descriptions of how the state changes. This means they can be logged, reversed and redone like Redux.
* Lightweight at 8KB minified, 2.5KB gzipped.
* Extremely simple API which can be learned in minutes without any complex underlying concepts.

## Installation
Install via npm: [(link)](http://npmjs.org/package/instate)

    $ npm install --save instate

## Docs
#### `@connect( stateMap [, targetState ] )` *decorator*
This is an ES7 decorator that must be called on the React component you want to connect to the global state. The `stateMap` parameter is a map of `localStatePropName: globalStateKeyPath`. For example, if you wanted the `user.name` key path in the global state to be under the `userName` property on the local, component state you would `@connect({ userName: "user.name" })`. The `targetState` parameter is the state to proxy the changes to and from the local, component state. Defaults to the global `state` but Instate allows you to pass in your own `State` if you feel like managing it yourself.

#### `state` *State instance*
The global application `State` object. This can be imported from anywhere in the application and you will always be referencing the same, global state. For methods associated with this object, see the `State` instance methods.

#### `new State( [ initialState:Object ] )` *class*
Create a new `State` object with `initialState` as it's initial state.

#### `State#get( keyPath:String )`
Get a value from the state object by key path. Example:

```js
state.setState({
    foo: {
        bar: "baz"
    }
});

state.get("foo.bar") // "baz"
```

#### `State#update( keyPath:String, value:Any [, create:Boolean ] )`
Update a value in the state at the given key path. Note: The state should **never be without the use of either `setState`, `delete` or this function.** The `create` flag describes whether the update creates the path as it traverses the tree. Think `mkdir -p`. Example:

```js
state.update("foo.bar", "baz");
state.get("foo.bar"); // "baz"
```

#### `State#subscribe( keyPath:String, listener:Function )`
Subscribe to updates on a key path. This function is fired any time a value of it's children are change. For example, if `foo.bar.baz` changes, `foo` and `foo.bar`'s listeners will fire. The `listener` function has the following signature: `(path, value, oldValue, state)`.

#### `State#unsubscribe( keyPath:String [, listener:Function ] )`
Unsubscribe from updates on a key path. If no listener is passed, all listeners under the keypath are removed otherwise just the listener itself passed will be removed.

#### `State#getState( state:Object )` and `State#setState( state:Object )`
Get and set the root state. 

#### `State#delete( keyPath:String )`
Delete a value from the state at a given key path. Note: Any subscriptions for the particular value will be notified that the value has changed to `undefined` however the key will be fully removed from the parent object.

##### Credits & License
Author: Adrian Cooney <cooney.adrian@gmail.com>

License: MIT